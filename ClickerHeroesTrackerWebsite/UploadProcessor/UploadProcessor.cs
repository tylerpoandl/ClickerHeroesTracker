﻿// <copyright file="UploadProcessor.cs" company="Clicker Heroes Tracker">
// Copyright (c) Clicker Heroes Tracker. All rights reserved.
// </copyright>

namespace ClickerHeroesTrackerWebsite.UploadProcessing
{
    using System;
    using System.Collections.Generic;
    using System.IO;
    using System.Text;
    using System.Threading.Tasks;
    using Database;
    using Instrumentation;
    using Microsoft.ApplicationInsights;
    using Microsoft.Extensions.Configuration;
    using Microsoft.ServiceBus.Messaging;
    using Models.Calculator;
    using Models.Game;
    using Models.SaveData;
    using Models.Settings;
    using Newtonsoft.Json;
    using Newtonsoft.Json.Converters;

    internal sealed class UploadProcessor : IDisposable
    {
        private static readonly JsonSerializer Serializer = CreateSerializer();

        private readonly HashSet<int> currentlyProcessingUploads = new HashSet<int>();

        private readonly GameData gameData;
        private readonly TelemetryClient telemetryClient;
        private readonly IConfiguration configuration;

        private readonly Dictionary<UploadProcessingMessagePriority, QueueClient> clients;

        /// <summary>
        /// Initializes a new instance of the <see cref="UploadProcessor"/> class.
        /// </summary>
        public UploadProcessor(
            IConfiguration configuration,
            GameData gameData,
            TelemetryClient telemetryClient)
        {
            this.configuration = configuration;
            this.gameData = gameData;
            this.telemetryClient = telemetryClient;

            var connectionString = configuration["UploadProcessing:ConnectionString"];
            this.clients = new Dictionary<UploadProcessingMessagePriority, QueueClient>
            {
                { UploadProcessingMessagePriority.Low, QueueClient.CreateFromConnectionString(connectionString, "UploadProcessing-LowPriority") },
                { UploadProcessingMessagePriority.High, QueueClient.CreateFromConnectionString(connectionString, "UploadProcessing-HighPriority") },
            };
        }

        public void Start()
        {
            foreach (var client in this.clients.Values)
            {
                client.OnMessageAsync(this.ProcessMessage, new OnMessageOptions { AutoComplete = false });
            }
        }

        public void Stop()
        {
            foreach (var client in this.clients.Values)
            {
                client.Close();
            }
        }

        /// <inheritdoc />
        public void Dispose()
        {
            lock (this.currentlyProcessingUploads)
            {
                foreach (var uploadId in this.currentlyProcessingUploads)
                {
                    var properties = new Dictionary<string, string>
                    {
                        { "UploadId", uploadId.ToString() }
                    };
                    this.telemetryClient.TrackEvent("UploadProcessor-Abandoned-Disposed", properties);
                }
            }

            this.Stop();
        }

        private static JsonSerializer CreateSerializer()
        {
            var settings = new JsonSerializerSettings();
            settings.NullValueHandling = NullValueHandling.Ignore;
            settings.Converters.Add(new StringEnumConverter { CamelCaseText = true });

            return JsonSerializer.CreateDefault(settings);
        }

        private static UploadProcessingMessage ParseMessage(BrokeredMessage brokeredMessage)
        {
            var stream = brokeredMessage.GetBody<Stream>();
            var jsonReader = new JsonTextReader(new StreamReader(stream));
            return Serializer.Deserialize<UploadProcessingMessage>(jsonReader);
        }

        private async Task ProcessMessage(BrokeredMessage brokeredMessage)
        {
            var properties = new Dictionary<string, string>();
            properties.Add("BrokeredMessage-CorrelationId", brokeredMessage.CorrelationId);
            properties.Add("BrokeredMessage-DeliveryCount", brokeredMessage.DeliveryCount.ToString());
            properties.Add("BrokeredMessage-EnqueuedTimeUtc", brokeredMessage.EnqueuedTimeUtc.ToString());
            properties.Add("BrokeredMessage-MessageId", brokeredMessage.MessageId);

            this.telemetryClient.TrackEvent("UploadProcessor-Recieved", properties);

            using (var counterProvider = new CounterProvider(this.telemetryClient))
            using (var databaseCommandFactory = new DatabaseCommandFactory(
                this.configuration,
                this.telemetryClient,
                counterProvider))
            using (counterProvider.Measure(Counter.ProcessUpload))
            {
                int uploadId = -1;
                var userSettingsProvider = new UserSettingsProvider(databaseCommandFactory);
                try
                {
                    var message = ParseMessage(brokeredMessage);
                    if (message == null)
                    {
                        this.telemetryClient.TrackEvent("UploadProcessor-Abandoned-ParseMessage", properties);
                        await brokeredMessage.AbandonAsync();
                        return;
                    }

                    uploadId = message.UploadId;
                    properties.Add("UploadId", uploadId.ToString());

                    lock (this.currentlyProcessingUploads)
                    {
                        this.currentlyProcessingUploads.Add(uploadId);
                    }

                    string uploadContent;
                    string userId;
                    this.GetUploadDetails(databaseCommandFactory, uploadId, out uploadContent, out userId);
                    properties.Add("UserId", userId);
                    if (string.IsNullOrWhiteSpace(uploadContent))
                    {
                        this.telemetryClient.TrackEvent("UploadProcessor-Abandoned-FetchUpload", properties);
                        await brokeredMessage.AbandonAsync();
                        return;
                    }

                    // Handle legacy uplaods where the upload content was missing.
                    if (uploadContent.Equals("LEGACY", StringComparison.OrdinalIgnoreCase))
                    {
                        this.telemetryClient.TrackEvent("UploadProcessor-Complete-Legacy", properties);
                        await brokeredMessage.CompleteAsync();
                        return;
                    }

                    var userSettings = userSettingsProvider.Get(userId);
                    if (userSettings == null)
                    {
                        this.telemetryClient.TrackEvent("UploadProcessor-Abandoned-FetchUserSettings", properties);
                        await brokeredMessage.AbandonAsync();
                        return;
                    }

                    var savedGame = SavedGame.Parse(uploadContent);
                    if (savedGame == null)
                    {
                        this.telemetryClient.TrackEvent("UploadProcessor-Abandoned-ParseUpload", properties);
                        await brokeredMessage.AbandonAsync();
                        return;
                    }

                    this.telemetryClient.TrackEvent("UploadProcessor-Simulation", properties);
                    var ancientLevels = new AncientLevelSummaryViewModel(
                        this.gameData,
                        savedGame,
                        this.telemetryClient);
                    var computedStats = new ComputedStatsViewModel(
                        this.gameData,
                        savedGame,
                        userSettings,
                        counterProvider);

                    /* Build a query that looks like this:
                        MERGE INTO AncientLevels WITH (HOLDLOCK)
                        USING
                            (VALUES (123, 1, 100), (123, 2, 100), ... )
                                AS Input(UploadId, AncientId, Level)
                            ON AncientLevels.UploadId = Input.UploadId
                            AND AncientLevels.AncientId = Input.AncientId
                        WHEN MATCHED THEN
                            UPDATE
                            SET
                                Level = Input.Level
                        WHEN NOT MATCHED THEN
                            INSERT (UploadId, AncientId, Level)
                            VALUES (Input.UploadId, Input.AncientId, Input.Level);
                    */
                    var ancientLevelsCommandText = new StringBuilder();
                    if (ancientLevels.AncientLevels.Count > 0)
                    {
                        ancientLevelsCommandText.Append(@"
                        MERGE INTO AncientLevels WITH (HOLDLOCK)
                        USING
                            ( VALUES ");
                        var isFirst = true;
                        foreach (var pair in ancientLevels.AncientLevels)
                        {
                            if (!isFirst)
                            {
                                ancientLevelsCommandText.Append(",");
                            }

                            // No need to sanitize, these are all just numbers
                            ancientLevelsCommandText.Append("(");
                            ancientLevelsCommandText.Append(uploadId);
                            ancientLevelsCommandText.Append(",");
                            ancientLevelsCommandText.Append(pair.Key.Id);
                            ancientLevelsCommandText.Append(",");
                            ancientLevelsCommandText.Append(pair.Value.AncientLevel);
                            ancientLevelsCommandText.Append(")");

                            isFirst = false;
                        }

                        ancientLevelsCommandText.Append(@"
                            )
                                AS Input(UploadId, AncientId, Level)
                            ON AncientLevels.UploadId = Input.UploadId
                            AND AncientLevels.AncientId = Input.AncientId
                        WHEN MATCHED THEN
                            UPDATE
                            SET
                                Level = Input.Level
                        WHEN NOT MATCHED THEN
                            INSERT (UploadId, AncientId, Level)
                            VALUES (Input.UploadId, Input.AncientId, Input.Level);");
                    }

                    const string ComputedStatsCommandText = @"
                        MERGE INTO ComputedStats WITH (HOLDLOCK)
                        USING
                            (VALUES (@UploadId, @OptimalLevel, @SoulsPerHour, @SoulsPerAscension, @AscensionTime, @TitanDamage, @SoulsSpent) )
                                AS Input(UploadId, OptimalLevel, SoulsPerHour, SoulsPerAscension, AscensionTime, TitanDamage, SoulsSpent)
                            ON ComputedStats.UploadId = Input.UploadId
                        WHEN MATCHED THEN
                            UPDATE
                            SET
                                OptimalLevel = Input.OptimalLevel,
                                SoulsPerHour = Input.SoulsPerHour,
                                SoulsPerAscension = Input.SoulsPerAscension,
                                AscensionTime = Input.AscensionTime,
                                TitanDamage = Input.TitanDamage,
                                SoulsSpent = Input.SoulsSpent
                        WHEN NOT MATCHED THEN
                            INSERT (UploadId, OptimalLevel, SoulsPerHour, SoulsPerAscension, AscensionTime, TitanDamage, SoulsSpent)
                            VALUES (Input.UploadId, Input.OptimalLevel, Input.SoulsPerHour, Input.SoulsPerAscension, Input.AscensionTime, Input.TitanDamage, Input.SoulsSpent);";
                    var computedStatsCommandParameters = new Dictionary<string, object>
                    {
                        { "@UploadId", uploadId },
                        { "@OptimalLevel", computedStats.OptimalLevel },
                        { "@SoulsPerHour", computedStats.SoulsPerHour },
                        { "@SoulsPerAscension", computedStats.OptimalSoulsPerAscension },
                        { "@AscensionTime", computedStats.OptimalAscensionTime },
                        { "@TitanDamage", computedStats.TitanDamage },
                        { "@SoulsSpent", computedStats.SoulsSpent },
                    };

                    using (var command = databaseCommandFactory.Create())
                    {
                        command.BeginTransaction();

                        if (ancientLevelsCommandText.Length > 0)
                        {
                            command.CommandText = ancientLevelsCommandText.ToString();
                            command.ExecuteNonQuery();
                        }

                        command.CommandText = ComputedStatsCommandText;
                        command.Parameters = computedStatsCommandParameters;
                        command.ExecuteNonQuery();

                        var commited = command.CommitTransaction();
                        if (!commited)
                        {
                            this.telemetryClient.TrackEvent("UploadProcessor-Abandoned-CommitTransaction", properties);
                            await brokeredMessage.AbandonAsync();
                            return;
                        }
                    }

                    this.telemetryClient.TrackEvent("UploadProcessor-Complete", properties);
                    await brokeredMessage.CompleteAsync();
                }
                catch (Exception e)
                {
                    this.telemetryClient.TrackException(e, properties);
                    await brokeredMessage.AbandonAsync();
                }
                finally
                {
                    lock (this.currentlyProcessingUploads)
                    {
                        this.currentlyProcessingUploads.Remove(uploadId);
                    }
                }
            }
        }

        private void GetUploadDetails(IDatabaseCommandFactory databaseCommandFactory, int uploadId, out string uploadContent, out string userId)
        {
            const string CommandText = @"
	            SELECT UploadContent, UserId
	            FROM Uploads
	            WHERE Id = @UploadId";
            var commandParameters = new Dictionary<string, object>
            {
                { "@UploadId", uploadId },
            };
            using (var command = databaseCommandFactory.Create(
                CommandText,
                commandParameters))
            using (var reader = command.ExecuteReader())
            {
                reader.Read();
                uploadContent = reader["UploadContent"].ToString();
                userId = reader["UserId"].ToString();
            }
        }
    }
}