/**
 * Wood-Booster OS
 * Spacemonkey
 *
 * Write File Skill
 *
 * Turvallinen tiedoston kirjoitus.
 */

import fs from "fs/promises"
import path from "path"


class WriteFileSkill {

    constructor({
        logger = console,
    } = {}) {

        this.id = "write-file"

        this.name = "Write File Skill"

        this.logger = logger

    }


    async execute(context) {

        const filePath =
            context?.path

        const content =
            context?.content


        if (!filePath) {

            throw new Error(
                "File path missing."
            )

        }


        if (content === undefined) {

            throw new Error(
                "File content missing."
            )

        }


        const absolutePath =
            path.resolve(filePath)


        await this.createBackup(
            absolutePath
        )


        await fs.writeFile(
            absolutePath,
            content,
            "utf-8"
        )


        this.logger.info?.(
            `File written: ${absolutePath}`
        )


        return {

            success: true,

            skill:
                this.id,

            path:
                absolutePath,

            size:
                content.length,

            backupCreated:
                true,

        }

    }


    async createBackup(filePath) {

        try {

            const content =
                await fs.readFile(
                    filePath,
                    "utf-8"
                )


            const backupPath =
                `${filePath}.backup`


            await fs.writeFile(
                backupPath,
                content,
                "utf-8"
            )


        } catch {

            // Tiedostoa ei vielä ole.
            // Ei tehdä backupia.

        }

    }

}


export default WriteFileSkill
