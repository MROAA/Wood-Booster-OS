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

import path from "node:path"

import { fileURLToPath } from "node:url"


// Repositorion juuri (agents/runtime -> server/services/spacemonkey ->
// repo). Developer Agentin vain luku -haku pysyy tämän sisällä.
const DEFAULT_PROJECT_ROOT = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../../../../..",
)


/*
 * Agenttien kuvaukset Agent Runtimelle (kyvykkyydet, työympäristö,
 * oikeustaso, työkalut, lähde). Oikeustasot: security/accessLevels.js.
 * Keskustelu sallii toistaiseksi vain observe-tason, joten julkaisu-
 * kyvykkyydet näkyvät inventaariossa mutta eivät ole valittavissa.
 */
const AGENT_DESCRIPTORS = {

    "developer-agent": {
        purpose:
            "Ohjelmistokehityksen työnkulku. Keskustelusta käytössä vain " +
            "tiedostohaku (observe); kirjoitus-, testi- ja commit-vaiheet " +
            "eivät ole valittavissa, ja ApprovalSkill hylkää ne aina.",
        source: "server/services/spacemonkey/agents/developer/DeveloperAgent.js",
        workspaces: ["hq"],
        capabilities: [
            {
                id: "dev.project.find-files",
                name: "Tiedostohaku projektista",
                access: "observe",
            },
        ],
        tools: [
            "file-search",
            "project-structure-analyzer",
            "code-intelligence-analyzer",
        ],
        permissions: ["project.files.list"],
        tests: [
            "server/services/spacemonkey/agents/tests/developerAgentReadOnly.test.js",
            "server/services/spacemonkey/tests/test-developer-agent.js",
        ],
        overlapsWith: ["python-developer", "code-change-developer"],
    },

    "wordpress-agent": {
        purpose: "WordPress-tehtävät plannerin ja ToolBusin kautta.",
        source: "server/services/spacemonkey/agents/wordpress/WordPressAgent.js",
        workspaces: ["hq"],
        capabilities: [
            {
                id: "marketing.wordpress.publish",
                name: "WordPress-julkaisu",
                access: "external-publishing",
            },
        ],
        tools: ["planner", "toolBus"],
        permissions: [],
        tests: [],
        overlapsWith: ["wordpress-publisher"],
    },

    "instagram-agent": {
        purpose: "Instagram-tehtävät plannerin ja ToolBusin kautta.",
        source: "server/services/spacemonkey/agents/instagram/InstagramAgent.js",
        workspaces: ["hq"],
        capabilities: [
            {
                id: "marketing.instagram.publish",
                name: "Instagram-julkaisu",
                access: "external-publishing",
            },
        ],
        tools: ["planner", "toolBus"],
        permissions: [],
        tests: [],
        overlapsWith: ["instagram-publisher"],
    },

}


function registerAgents({

    agentRuntime,

    planner,

    toolBus,

    memory,

    projectRoot = DEFAULT_PROJECT_ROOT,

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

            projectRoot,

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
        developerAgent,
        AGENT_DESCRIPTORS["developer-agent"],
    )


    agentRuntime.register(
        wordpressAgent,
        AGENT_DESCRIPTORS["wordpress-agent"],
    )


    agentRuntime.register(
        instagramAgent,
        AGENT_DESCRIPTORS["instagram-agent"],
    )


    return agentRuntime

}


export default registerAgents

export { AGENT_DESCRIPTORS, DEFAULT_PROJECT_ROOT }
