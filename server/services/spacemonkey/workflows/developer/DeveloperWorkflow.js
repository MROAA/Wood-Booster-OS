/**
 * Wood-Booster HQ
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

        projectUnderstandingAnalyzer,

        codeIntelligenceAnalyzer,

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


        this.projectUnderstandingAnalyzer =
            projectUnderstandingAnalyzer


        this.codeIntelligenceAnalyzer =
            codeIntelligenceAnalyzer


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
                    context.search ?? "",

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



        const understanding =
            this.projectUnderstandingAnalyzer.analyze(
                structure
            )



        const codeIntelligence =
            this.codeIntelligenceAnalyzer.analyze(
                files.results
            )



        const contents = []



        for (const file of files.results) {


            const content =
                await this.readFileSkill.execute({

                    path:
                        file,

                })


            contents.push(
                content
            )

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

            structure,

            understanding,

            codeIntelligence,

        }



        state.transition(
            "WAITING_APPROVAL"
        )



        const approval =
            await this.approvalSkill.execute({

                action:
                    plan,

            })



        if (!approval.approved) {


            return {

                success: false,

                status:
                    "waiting-for-approval",


                state:
                    state.snapshot(),


                plan,


                analysis,


                structure,


                understanding,


                codeIntelligence,

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


            structure,


            understanding,


            codeIntelligence,


            contents,


            writeResult,


            tests,


            commit,

        }


    }


}


export default DeveloperWorkflow