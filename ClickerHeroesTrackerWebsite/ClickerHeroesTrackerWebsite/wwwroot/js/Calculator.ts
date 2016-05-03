﻿namespace Calculator
{
    "use strict";

    function handleSuccess(upload: IUpload): void
    {
        const userNameElements = Helpers.getElementsByDataType("uploadUserName");
        for (let i = 0; i < userNameElements.length; i++)
        {
            if (upload.user && upload.user.name)
            {
                userNameElements[i].innerText = upload.user.name;
            }
            else
            {
                userNameElements[i].classList.add("text-muted");
                userNameElements[i].innerText = "(Anonymous)";
            }
        }

        const submitTimeElements = Helpers.getElementsByDataType("uploadSubmitTime");
        if (upload.timeSubmitted)
        {
            const timeSubmitted = new Date(upload.timeSubmitted);
            for (let i = 0; i < submitTimeElements.length; i++)
            {
                submitTimeElements[i].innerText = timeSubmitted.toLocaleString();
            }
        }

        const uploadContentElements = Helpers.getElementsByDataType("uploadContent");
        if (upload.uploadContent)
        {
            for (let i = 0; i < uploadContentElements.length; i++)
            {
                uploadContentElements[i].innerText = upload.uploadContent;
            }
        }

        if (upload.stats)
        {
            for (let statType in upload.stats)
            {
                hydrateStat(upload.stats, statType, upload.stats[statType]);
            }
        }
    }

    function hydrateStat(stats: IMap<number>, statType: string, statValue: number): void
    {
        const statElements = Helpers.getElementsByDataType(statType);
        if (statElements)
        {
            const isAbbreviated = Math.abs(statValue) > 1e6;

            let fullText = statValue.toLocaleString();
            let displayText = isAbbreviated ? statValue.toExponential(3) : fullText;

            if (statType.indexOf("item") === 0)
            {
                displayText = "(+" + displayText + ")";
            }

            if (statType.indexOf("suggested") === 0)
            {
                const diffStatType = statType.replace("suggested", "diff");
                const ancientStatType = statType.replace("suggested", "ancient");
                const itemStatType = statType.replace("suggested", "item");
                const ancientStatValue = stats[ancientStatType] || 0;
                const itemStatValue = stats[itemStatType] || 0;

                hydrateStat(stats, diffStatType, statValue - ancientStatValue - itemStatValue);
            }

            for (let i = 0; i < statElements.length; i++)
            {
                if (isAbbreviated)
                {
                    statElements[i].title = fullText;
                }

                statElements[i].innerText = displayText;
            }
        }
    }

    function displayFailure(): void
    {
        // BUGBUG 51: Create Loading and Failure states for ajax loading
    }

    const uploadId = Helpers.getElementsByDataType("uploadId")[0].innerText;

    $.ajax({
        url: "/api/uploads/" + uploadId,
    })
        .done(handleSuccess)
        .fail(displayFailure);
}
