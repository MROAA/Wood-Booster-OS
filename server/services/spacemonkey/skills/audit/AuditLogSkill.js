/**
 * Wood-Booster HQ
 * Spacemonkey
 *
 * Audit Log Skill
 *
 * Tallentaa järjestelmän tapahtumat.
 */

import fs from "fs/promises"
import path from "path"


class AuditLogSkill {

    constructor({

        logPath =
            "server/services/spacemonkey/logs/audit.log",

        logger = console,

    } = {}) {

        this.id = "audit-log"

        this.name =
            "Audit Log Skill"

        this.logPath =
            path.resolve(logPath)

        this.logger =
            logger

    }


    async execute(context) {

        if (!context) {

            throw new Error(
                "Audit context missing."
            )

        }


        const entry = {

            timestamp:
                new Date().toISOString(),

            agent:
                context.agent ?? "unknown",

            action:
                context.action ?? "unknown",

            path:
                context.path ?? null,

            result:
                context.result ?? null,

            metadata:
                context.metadata ?? {},

        }


        await this.write(entry)


        return {

            success: true,

            skill:
                this.id,

            entry,

        }

    }


    async write(entry) {

        const directory =
            path.dirname(
                this.logPath
            )


        await fs.mkdir(
            directory,
            {
                recursive: true,
            }
        )


        await fs.appendFile(

            this.logPath,

            JSON.stringify(entry) + "\n",

            "utf-8"

        )


        this.logger.info?.(
            "Audit event recorded."
        )

    }

}


export default AuditLogSkill
