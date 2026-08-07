/**
 * Wood-Booster OS
 * Spacemonkey
 *
 * Git Commit Skill
 *
 * Luo Git commitin hallitusti.
 */

import { exec } from "child_process"
import { promisify } from "util"

const execAsync =
    promisify(exec)


class GitCommitSkill {

    constructor({

        logger = console,

    } = {}) {

        this.id =
            "git-commit"

        this.name =
            "Git Commit Skill"

        this.logger =
            logger

    }


    async execute(context) {

        const message =
            context?.message

        const cwd =
            context?.cwd


        if (!message) {

            throw new Error(
                "Commit message missing."
            )

        }


        try {

            const status =
                await execAsync(
                    "git status --short",
                    {
                        cwd,
                    }
                )


            if (!status.stdout.trim()) {

                return {

                    success: false,

                    skill:
                        this.id,

                    status:
                        "nothing-to-commit",

                    message:
                        "No changes detected.",

                }

            }


            await execAsync(
                "git add .",
                {
                    cwd,
                }
            )


            const commit =
                await execAsync(

                    `git commit -m "${message}"`,

                    {
                        cwd,
                    }

                )


            return {

                success: true,

                skill:
                    this.id,

                status:
                    "committed",

                output:
                    commit.stdout,

            }


        } catch (error) {


            return {

                success: false,

                skill:
                    this.id,

                status:
                    "failed",

                error:
                    error.message,

            }

        }

    }

}


export default GitCommitSkill
