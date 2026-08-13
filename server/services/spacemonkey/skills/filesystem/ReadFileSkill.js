/**
 * Wood-Booster HQ
 * Spacemonkey
 *
 * Read File Skill
 *
 * Lukee tiedoston sisällön turvallisesti.
 */

import fs from "fs/promises"
import path from "path"


class ReadFileSkill {

    constructor({
        logger = console,
    } = {}) {

        this.id = "read-file"

        this.name = "Read File Skill"

        this.logger = logger

    }


    async execute(context) {

        const filePath =
            context?.path


        if (!filePath) {

            throw new Error(
                "File path missing."
            )

        }


        const absolutePath =
            path.resolve(filePath)


        const content =
            await fs.readFile(
                absolutePath,
                "utf-8"
            )


        return {

            success: true,

            skill: this.id,

            path: absolutePath,

            size:
                content.length,

            content,

        }

    }

}


export default ReadFileSkill
