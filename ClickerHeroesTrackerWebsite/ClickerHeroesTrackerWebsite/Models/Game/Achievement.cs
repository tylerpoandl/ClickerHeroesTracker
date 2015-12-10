﻿// <copyright file="Achievement.cs" company="Clicker Heroes Tracker">
// Copyright (c) Clicker Heroes Tracker. All rights reserved.
// </copyright>

namespace ClickerHeroesTrackerWebsite.Models.Game
{
    using System.Collections.Generic;

    /// <summary>
    /// Represents an achievement in the game
    /// </summary>
    public class Achievement
    {
        private static Dictionary<int, Achievement> acievements = new Dictionary<int, Achievement>();

        static Achievement()
        {
            // Populated by: http://s3-us-west-2.amazonaws.com/clickerheroes/ancientssoul.html
            // var out = ""; for (var i = 1; i <= 103; i++) { var multIncrease = Achievements.hasOwnProperty(i) ? Achievements[i] : 5; out += "new Achievement(\n    id: " + i + ",\n    multiplier: 1.0" + multIncrease +"d);\n" };
            // TODO: move to SQL
            new Achievement(
                id: 1,
                multiplier: 1.01d);
            new Achievement(
                id: 2,
                multiplier: 1.02d);
            new Achievement(
                id: 3,
                multiplier: 1.03d);
            new Achievement(
                id: 4,
                multiplier: 1.05d);
            new Achievement(
                id: 5,
                multiplier: 1.01d);
            new Achievement(
                id: 6,
                multiplier: 1.02d);
            new Achievement(
                id: 7,
                multiplier: 1.03d);
            new Achievement(
                id: 8,
                multiplier: 1.05d);
            new Achievement(
                id: 9,
                multiplier: 1.01d);
            new Achievement(
                id: 10,
                multiplier: 1.02d);
            new Achievement(
                id: 11,
                multiplier: 1.03d);
            new Achievement(
                id: 12,
                multiplier: 1.05d);
            new Achievement(
                id: 13,
                multiplier: 1.01d);
            new Achievement(
                id: 14,
                multiplier: 1.02d);
            new Achievement(
                id: 15,
                multiplier: 1.03d);
            new Achievement(
                id: 16,
                multiplier: 1.05d);
            new Achievement(
                id: 17,
                multiplier: 1.01d);
            new Achievement(
                id: 18,
                multiplier: 1.02d);
            new Achievement(
                id: 19,
                multiplier: 1.03d);
            new Achievement(
                id: 20,
                multiplier: 1.05d);
            new Achievement(
                id: 21,
                multiplier: 1.01d);
            new Achievement(
                id: 22,
                multiplier: 1.02d);
            new Achievement(
                id: 23,
                multiplier: 1.03d);
            new Achievement(
                id: 24,
                multiplier: 1.05d);
            new Achievement(
                id: 25,
                multiplier: 1.01d);
            new Achievement(
                id: 26,
                multiplier: 1.02d);
            new Achievement(
                id: 27,
                multiplier: 1.03d);
            new Achievement(
                id: 28,
                multiplier: 1.05d);
            new Achievement(
                id: 29,
                multiplier: 1.01d);
            new Achievement(
                id: 30,
                multiplier: 1.02d);
            new Achievement(
                id: 31,
                multiplier: 1.03d);
            new Achievement(
                id: 32,
                multiplier: 1.05d);
            new Achievement(
                id: 33,
                multiplier: 1.01d);
            new Achievement(
                id: 34,
                multiplier: 1.02d);
            new Achievement(
                id: 35,
                multiplier: 1.03d);
            new Achievement(
                id: 36,
                multiplier: 1.05d);
            new Achievement(
                id: 37,
                multiplier: 1.00d);
            new Achievement(
                id: 38,
                multiplier: 1.00d);
            new Achievement(
                id: 39,
                multiplier: 1.03d);
            new Achievement(
                id: 40,
                multiplier: 1.05d);
            new Achievement(
                id: 41,
                multiplier: 1.03d);
            new Achievement(
                id: 42,
                multiplier: 1.05d);
            new Achievement(
                id: 43,
                multiplier: 1.00d);
            new Achievement(
                id: 44,
                multiplier: 1.00d);
            new Achievement(
                id: 45,
                multiplier: 1.00d);
            new Achievement(
                id: 46,
                multiplier: 1.00d);
            new Achievement(
                id: 47,
                multiplier: 1.05d);
            new Achievement(
                id: 48,
                multiplier: 1.05d);
            new Achievement(
                id: 49,
                multiplier: 1.05d);
            new Achievement(
                id: 50,
                multiplier: 1.05d);
            new Achievement(
                id: 51,
                multiplier: 1.05d);
            new Achievement(
                id: 52,
                multiplier: 1.05d);
            new Achievement(
                id: 53,
                multiplier: 1.05d);
            new Achievement(
                id: 54,
                multiplier: 1.05d);
            new Achievement(
                id: 55,
                multiplier: 1.05d);
            new Achievement(
                id: 56,
                multiplier: 1.05d);
            new Achievement(
                id: 57,
                multiplier: 1.05d);
            new Achievement(
                id: 58,
                multiplier: 1.05d);
            new Achievement(
                id: 59,
                multiplier: 1.00d);
            new Achievement(
                id: 60,
                multiplier: 1.05d);
            new Achievement(
                id: 61,
                multiplier: 1.00d);
            new Achievement(
                id: 62,
                multiplier: 1.05d);
            new Achievement(
                id: 63,
                multiplier: 1.05d);
            new Achievement(
                id: 64,
                multiplier: 1.05d);
            new Achievement(
                id: 65,
                multiplier: 1.05d);
            new Achievement(
                id: 66,
                multiplier: 1.05d);
            new Achievement(
                id: 67,
                multiplier: 1.05d);
            new Achievement(
                id: 68,
                multiplier: 1.05d);
            new Achievement(
                id: 69,
                multiplier: 1.05d);
            new Achievement(
                id: 70,
                multiplier: 1.05d);
            new Achievement(
                id: 71,
                multiplier: 1.05d);
            new Achievement(
                id: 72,
                multiplier: 1.05d);
            new Achievement(
                id: 73,
                multiplier: 1.05d);
            new Achievement(
                id: 74,
                multiplier: 1.05d);
            new Achievement(
                id: 75,
                multiplier: 1.05d);
            new Achievement(
                id: 76,
                multiplier: 1.05d);
            new Achievement(
                id: 77,
                multiplier: 1.05d);
            new Achievement(
                id: 78,
                multiplier: 1.05d);
            new Achievement(
                id: 79,
                multiplier: 1.05d);
            new Achievement(
                id: 80,
                multiplier: 1.05d);
            new Achievement(
                id: 81,
                multiplier: 1.05d);
            new Achievement(
                id: 82,
                multiplier: 1.05d);
            new Achievement(
                id: 83,
                multiplier: 1.05d);
            new Achievement(
                id: 84,
                multiplier: 1.05d);
            new Achievement(
                id: 85,
                multiplier: 1.05d);
            new Achievement(
                id: 86,
                multiplier: 1.05d);
            new Achievement(
                id: 87,
                multiplier: 1.05d);
            new Achievement(
                id: 88,
                multiplier: 1.05d);
            new Achievement(
                id: 89,
                multiplier: 1.05d);
            new Achievement(
                id: 90,
                multiplier: 1.05d);
            new Achievement(
                id: 91,
                multiplier: 1.00d);
            new Achievement(
                id: 92,
                multiplier: 1.00d);
            new Achievement(
                id: 93,
                multiplier: 1.00d);
            new Achievement(
                id: 94,
                multiplier: 1.05d);
            new Achievement(
                id: 95,
                multiplier: 1.05d);
            new Achievement(
                id: 96,
                multiplier: 1.05d);
            new Achievement(
                id: 97,
                multiplier: 1.05d);
            new Achievement(
                id: 98,
                multiplier: 1.05d);
            new Achievement(
                id: 99,
                multiplier: 1.05d);
            new Achievement(
                id: 100,
                multiplier: 1.05d);
            new Achievement(
                id: 101,
                multiplier: 1.05d);
            new Achievement(
                id: 102,
                multiplier: 1.05d);
            new Achievement(
                id: 103,
                multiplier: 1.05d);
        }

        private Achievement(
            int id,
            double multiplier)
        {
            this.Id = id;
            this.Multiplier = multiplier;

            // Add itself to the static collection
            acievements.Add(this.Id, this);
        }

        /// <summary>
        /// Gets the achievement id
        /// </summary>
        public int Id { get; }

        /// <summary>
        /// Gets the damage multiplier granted by the achievement.
        /// </summary>
        public double Multiplier { get; }

        /// <summary>
        /// Gets an achievement by id
        /// </summary>
        /// <returns>The achievement with the id, or null if one does not exist</returns>
        public static Achievement Get(int id)
        {
            Achievement acievement;
            return acievements.TryGetValue(id, out acievement) ? acievement : null;
        }
    }
}