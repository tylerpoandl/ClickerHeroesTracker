﻿CREATE TABLE [ComputedStats] (
    [Id]                INT      IDENTITY (1, 1) NOT NULL,
    [UploadId]          INT      NOT NULL,
    [OptimalLevel]      SMALLINT NOT NULL,
    [SoulsPerHour]      BIGINT   NOT NULL,
    [SoulsPerAscension] BIGINT   NOT NULL,
    [AscensionTime]     SMALLINT NOT NULL,
    [TitanDamage]       REAL     NOT NULL,
    [SoulsSpent]        REAL     NOT NULL
);