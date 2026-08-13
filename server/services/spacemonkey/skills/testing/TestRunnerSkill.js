/**
 * Wood-Booster HQ
 * Spacemonkey
 *
 * Test Runner Skill
 *
 * Suorittaa projektin testikomennon
 * hallitusti.
 */

import { exec } from "child_process"
import { promisify } from "util"

const execAsync =
    promisify(exec)


class TestRunnerSkill {

    constructor({

        logger = console,

    } = {}) {

        this.id =
            "test-runner"

        this.name =
            "Test Runner Skill"

        this.logger =
            logger

    }


    async execute(context) {

        const command =
            context?.command


        const cwd =
            context?.cwd


        if (!command) {

            throw new Error(
                "Test command missing."
            )

        }


        this.logger.info?.(
            `Running test: ${command}`
        )


        try {

            const {
                stdout,
                stderr
            } =
                await execAsync(
                    command,
                    {
                        cwd,
                    }
                )


            return {

                success: true,

                skill:
                    this.id,

                command,

                stdout,

                stderr,

                status:
                    "passed",

            }


        } catch (error) {


            return {

                success: false,

                skill:
                    this.id,

                command,

                error:
                    error.message,

                stdout:
                    error.stdout ?? "",

                stderr:
                    error.stderr ?? "",

                status:
                    "failed",

            }

        }

    }

}


export default TestRunnerSkill
