/**
 * Wood-Booster HQ
 * Spacemonkey
 *
 * File Permission Skill
 *
 * Hallitsee tiedostojen käyttöoikeuksia.
 */

import path from "path"


class FilePermissionSkill {

    constructor({

        allowedPaths = [],

        blockedPaths = [],

        logger = console,

    } = {}) {

        this.id = "file-permission"

        this.name =
            "File Permission Skill"

        this.allowedPaths =
            allowedPaths.map(
                item => path.resolve(item)
            )

        this.blockedPaths =
            blockedPaths.map(
                item => path.resolve(item)
            )

        this.logger = logger

    }


    async execute(context) {

        const targetPath =
            context?.path


        if (!targetPath) {

            throw new Error(
                "Path missing."
            )

        }


        const absolutePath =
            path.resolve(targetPath)


        const blocked =
            this.blockedPaths.some(
                blockedPath =>
                    absolutePath.startsWith(
                        blockedPath
                    )
            )


        if (blocked) {

            return {

                success: false,

                allowed: false,

                reason:
                    "Path is blocked.",

                path:
                    absolutePath,

            }

        }


        if (
            this.allowedPaths.length > 0
        ) {

            const allowed =
                this.allowedPaths.some(
                    allowedPath =>
                        absolutePath.startsWith(
                            allowedPath
                        )
                )


            return {

                success: true,

                allowed,

                path:
                    absolutePath,

                reason:
                    allowed
                        ? "Path allowed."
                        : "Path outside allowed areas.",

            }

        }


        return {

            success: true,

            allowed: false,

            path:
                absolutePath,

            reason:
                "No allowed paths configured.",

        }

    }

}


export default FilePermissionSkill
