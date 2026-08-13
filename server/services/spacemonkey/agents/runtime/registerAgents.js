/**
 * Wood-Booster HQ
 * Spacemonkey
 *
 * Agent Registration
 *
 * Rekisteröi kaikki agentit Runtimeen.
 */

import DeveloperAgent from "../developer/DeveloperAgent.js"
import WordPressAgent from "../wordpress/WordPressAgent.js"
import InstagramAgent from "../instagram/InstagramAgent.js"
import ProjectStructureAnalyzer from "../../skills/analyze/ProjectStructureAnalyzer.js"
import CodeIntelligenceAnalyzer from "../../skills/analyze/CodeIntelligenceAnalyzer.js"
import ProjectUnderstandingAnalyzer from "../../skills/analyze/ProjectUnderstandingAnalyzer.js"
import DeveloperWorkflow from "../../workflows/developer/DeveloperWorkflow.js"


import AnalyzeProjectSkill from "../../skills/analyze/AnalyzeProjectSkill.js"

import ReadFileSkill from "../../skills/filesystem/ReadFileSkill.js"

import FileSearchSkill from "../../skills/filesystem/FileSearchSkill.js"

import ApprovalSkill from "../../skills/security/ApprovalSkill.js"

import TestRunnerSkill from "../../skills/testing/TestRunnerSkill.js"

import GitCommitSkill from "../../skills/git/GitCommitSkill.js"

import SecureFileWriteWorkflow from "../../workflows/filesystem/SecureFileWriteWorkflow.js"


function registerAgents({

    agentRuntime,

    planner,

    toolBus,

    memory,

    logger = console,

}) {


    const analyzeSkill =
        new AnalyzeProjectSkill({
            logger,
        })


    const readFileSkill =
        new ReadFileSkill({
            logger,
        })


    const fileSearchSkill =
        new FileSearchSkill({
            logger,
        })


    const approvalSkill =
        new ApprovalSkill({
            logger,
        })


    const testRunnerSkill =
        new TestRunnerSkill({
            logger,
        })


    const gitCommitSkill =
        new GitCommitSkill({
            logger,
        })


    const secureWriteWorkflow =
        new SecureFileWriteWorkflow({

            permissionSkill:
                null,

            writeFileSkill:
                null,

            auditLogSkill:
                null,

            logger,

        })

const projectStructureAnalyzer =
    new ProjectStructureAnalyzer({
        logger,
    })
    const codeIntelligenceAnalyzer =
new CodeIntelligenceAnalyzer({
    logger,
})
const projectUnderstandingAnalyzer =
new ProjectUnderstandingAnalyzer({
    logger,
})
    const developerWorkflow =
        new DeveloperWorkflow({

            analyzeSkill,

            fileSearchSkill,

            readFileSkill,

            approvalSkill,

            secureWriteWorkflow,

            testRunnerSkill,

            gitCommitSkill,
projectUnderstandingAnalyzer,
codeIntelligenceAnalyzer,
            logger,
projectStructureAnalyzer,

        })



    const developerAgent =
        new DeveloperAgent({

            workflow:
                developerWorkflow,

            planner,

            toolBus,

            memory,

            logger,

        })



    const wordpressAgent =
        new WordPressAgent({

            planner,

            toolBus,

            memory,

            logger,

        })


    const instagramAgent =
        new InstagramAgent({

            planner,

            toolBus,

            memory,

            logger,

        })



    agentRuntime.register(
        developerAgent
    )


    agentRuntime.register(
        wordpressAgent
    )


    agentRuntime.register(
        instagramAgent
    )


    return agentRuntime

}


export default registerAgents
