/**
 * Wood-Booster HQ
 * Spacemonkey
 *
 * Developer Workflow v2
 *
 * Hallittu ohjelmistokehityksen työnkulku.
 */

import path from "node:path"

import DeveloperWorkflowState from "./DeveloperWorkflowState.js"

import { isProtectedPath } from "../../security/protectedPaths.js"


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



    /*
     * Vain luku -polku (oikeustaso observe): sama tiedostohaku ja samat
     * analysoijat kuin execute():n alussa, mutta EI hyväksyntää,
     * kirjoitusta, testikomentoa eikä committia, eikä tiedostojen
     * sisältöä lueta lainkaan. Suojatut polut (salaisuudet, avaimet,
     * tietokannat...) jätetään tuloksista pois ja niiden määrä kerrotaan.
     */
    async inspect({
        projectPath,
        search,
        maxResults = 50,
    } = {}) {


        const files =
            await this.fileSearchSkill.execute({

                directory:
                    projectPath,

                search,

            })


        const visible =
            files.results.filter(
                file =>
                    !isProtectedPath(
                        path.relative(projectPath, file)
                    )
            )


        const structure =
            this.projectStructureAnalyzer.analyze(
                visible
            )


        const understanding =
            this.projectUnderstandingAnalyzer.analyze(
                structure
            )


        const codeIntelligence =
            this.codeIntelligenceAnalyzer.analyze(
                visible.slice(0, maxResults)
            )


        return {

            success: true,

            status:
                "inspected",

            readOnly: true,

            search,

            total:
                visible.length,

            hiddenProtected:
                files.results.length - visible.length,

            files:
                codeIntelligence.files.map(
                    item => ({
                        path:
                            path.relative(projectPath, item.file),
                        role:
                            item.role,
                    })
                ),

            structure,

            understanding,

        }


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