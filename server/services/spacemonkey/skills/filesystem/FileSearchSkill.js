/**
 * Wood-Booster OS
 * Spacemonkey
 *
 * File Search Skill
 *
 * Etsii tiedostoja hakemistosta.
 */

import fs from "fs/promises"
import path from "path"


class FileSearchSkill {

    constructor({
        logger = console,
    } = {}) {

        this.id = "file-search"

        this.name = "File Search Skill"

        this.logger = logger

    }


    async execute(context) {

        const directory =
            context?.directory

        const search =
            context?.search


        if (!directory) {

            throw new Error(
                "Directory missing."
            )

        }


        if (!search) {

            throw new Error(
                "Search term missing."
            )

        }


        const results = []


        await this.scan(
            path.resolve(directory),
            search,
            results
        )


        return {

            success: true,

            skill: this.id,

            search,

            results,

            count:
                results.length,

        }

    }


    async scan(
        directory,
        search,
        results
    ) {

        const entries =
            await fs.readdir(
                directory,
                {
                    withFileTypes: true,
                }
            )


        for (const entry of entries) {


            const fullPath =
                path.join(
                    directory,
                    entry.name
                )


            if (entry.isDirectory()) {

                await this.scan(
                    fullPath,
                    search,
                    results
                )

                continue

            }


            if (
                entry.name
                    .toLowerCase()
                    .includes(
                        search.toLowerCase()
                    )
            ) {

                results.push(fullPath)

            }

        }

    }

}


export default FileSearchSkill
