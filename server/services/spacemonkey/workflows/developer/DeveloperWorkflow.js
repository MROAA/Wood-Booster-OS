/**
 * Wood-Booster OS
 * Spacemonkey
 *
 * Developer Workflow v2
 *
 * Hallittu ohjelmistokehityksen työnkulku.
 */

import DeveloperWorkflowState from "./DeveloperWorkflowState.js"


class DeveloperWorkflow {

    constructor({

        analyzeSkill,

        fileSearchSkill,

        readFileSkill,

        approvalSkill,

        secureWriteWorkflow,

        testRunnerSkill,

gitCommitSkill,

projectStructureAnalyzer,

logger = console,
    } = {}) {


        this.id =
            "developer-workflow"


        this.name =
            "Developer Workflow"


        this.analyzeSkill =
            analyzeSkill


        this.fileSearchSkill =
            fileSearchSkill


        this.readFileSkill =
            readFileSkill


        this.approvalSkill =
            approvalSkill


        this.secureWriteWorkflow =
            secureWriteWorkflow


        this.testRunnerSkill =
            testRunnerSkill


this.gitCommitSkill =
    gitCommitSkill


this.projectStructureAnalyzer =
    projectStructureAnalyzer


this.logger =
    logger

    }


    async execute(context) {


        const state =
            new DeveloperWorkflowState({
                logger:
                    this.logger,
            })


state.transition(
    "ANALYZING"
)


const files =
    await this.fileSearchSkill.execute({

        directory:
            context.projectPath,

        search:
            context.search ?? ""

    })


const analysis =
    await this.analyzeSkill.execute({

        ...context,

        files:
            files.results,

    })
const structure =
    this.projectStructureAnalyzer.analyze(
        files.results
    )
    this.logger.info(
    "PROJECT STRUCTURE RESULT",
    structure
)
        const contents = []


        for (const file of files.results) {

            const content =
                await this.readFileSkill.execute({

                    path:
                        file

                })


            contents.push(content)

        }


        state.transition(
            "PLANNING"
        )


        const plan = {

            action:
                context.action,

            files:
                files.results,

            analysis,

        }


        state.transition(
            "WAITING_APPROVAL"
        )


        const approval =
            await this.approvalSkill.execute({

                action:
                    plan

            })


        if (!approval.approved) {

            return {

                success: false,

                status:
                    "waiting-for-approval",

                state:
                    state.snapshot(),

                plan,

            }

        }


        state.transition(
            "EXECUTING"
        )


        const writeResult =
            await this.secureWriteWorkflow.execute(
                context
            )


        state.transition(
            "TESTING"
        )


        const tests =
            await this.testRunnerSkill.execute({

                command:
                    context.testCommand,

                cwd:
                    context.projectPath,

            })


        state.transition(
            "COMMITTING"
        )


        const commit =
            await this.gitCommitSkill.execute({

                message:
                    context.commitMessage,

                cwd:
                    context.projectPath,

            })


        state.transition(
            "COMPLETED"
        )


        return {

            success: true,

            workflow:
                this.id,

            state:
                state.snapshot(),

            analysis,

            contents,

            writeResult,

            tests,

            commit,
structure,

        }

    }

}


export default DeveloperWorkflow
