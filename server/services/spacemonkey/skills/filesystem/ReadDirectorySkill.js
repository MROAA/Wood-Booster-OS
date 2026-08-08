/**
 * Wood-Booster HQ
 * Spacemonkey
 *
 * Read Directory Skill
 *
 * Lukee turvallisesti hakemiston sisällön.
 */

import fs from "fs/promises"
import path from "path"

class ReadDirectorySkill {

    constructor({
        logger = console,
    } = {}) {

        this.id = "read-directory"

        this.name = "Read Directory Skill"

        this.logger = logger

    }


    async execute(context) {

        const directory =
            context?.path


        if (!directory) {

            throw new Error(
                "Directory path missing."
            )

        }


        const absolutePath =
            path.resolve(directory)


        const files =
            await fs.readdir(
                absolutePath,
                {
                    withFileTypes: true,
                }
            )


        return {

            success: true,

            skill: this.id,

            path: absolutePath,

            entries:
                files.map(file => ({

                    name:
                        file.name,

                    type:
                        file.isDirectory()
                            ? "directory"
                            : "file",

                })),

        }

    }

}

export default ReadDirectorySkill
