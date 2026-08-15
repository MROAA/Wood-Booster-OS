import {
  createSpacemonkeySecurityMemoryRouter,
} from "./routes/spacemonkeySecurityMemory.js"
import {
  createSpacemonkeyInternetSafetyRouter,
} from "./routes/spacemonkeyInternetSafety.js"
import architectureAuditRouter from "./routes/architectureAudit.js"
import systemInstallerRestoreApprovalRouter from "./routes/systemInstallerRestoreApproval.js"
import {
  createSpacemonkeySecuritySandboxRouter,
} from "./routes/spacemonkeySecuritySandbox.js"
import architectureHealthRouter from "./routes/architectureHealth.js"
import systemInstallerAuditRouter from "./routes/systemInstallerAudit.js"
import systemInstallerRouter from "./routes/systemInstaller.js"
import {
  createSpacemonkeySecurityCapabilitiesRouter,
} from "./routes/spacemonkeySecurityCapabilities.js"
import {
  createSpacemonkeySecurityOverviewRouter,
} from "./routes/spacemonkeySecurityOverview.js"
import {
  createSpacemonkeySecurityReflectionRouter,
} from "./routes/spacemonkeySecurityReflection.js"
import {
  createSpacemonkeySecurityAuditRouter,
} from "./routes/spacemonkeySecurityAudit.js"
import {
  createSpacemonkeyToolSecurityRouter,
} from "./routes/spacemonkeyToolSecurity.js"
import {
  createSpacemonkeyDockerCapabilityRouter,
} from "./routes/spacemonkeyDockerCapability.js"
import {
  createSpacemonkeyDatabaseCapabilityRouter,
} from "./routes/spacemonkeyDatabaseCapability.js"
import {
  createSpacemonkeyNetworkingCapabilityRouter,
} from "./routes/spacemonkeyNetworkingCapability.js"
import {
  createSpacemonkeyLinuxAdvancedCapabilityRouter,
} from "./routes/spacemonkeyLinuxAdvancedCapability.js"
import {
  createSpacemonkeyCybersecurityCapabilityRouter,
} from "./routes/spacemonkeyCybersecurityCapability.js"
import {
  createSpacemonkeySecurityRuntimeRouter,
} from "./routes/spacemonkeySecurityRuntime.js"
import {
  createSpacemonkeySecurityPolicyRouter,
} from "./routes/spacemonkeySecurityPolicy.js"
import {
  createSpacemonkeyPermissionsRouter,
} from "./routes/spacemonkeyPermissions.js"
import {
  createSpacemonkeyApprovalGatewayRouter,
} from "./routes/spacemonkeyApprovalGateway.js"
import {
  createSpacemonkeySecurityCoreRouter,
} from "./routes/spacemonkeySecurityCore.js"
import {
  createSpacemonkeyPersonalityRuntimeRouter,
} from "./routes/spacemonkeyPersonalityRuntime.js"
import {
  createSpacemonkeyCapabilityRegistryRouter,
} from "./routes/spacemonkeyCapabilityRegistry.js"
import {
  createSpacemonkeyKnowledgeRouter,
} from "./routes/spacemonkeyKnowledge.js"
import path from "node:path"
import { fileURLToPath } from "node:url"

import express from "express"
import cors from "cors"
import {
  createSpacemonkeyMemoryRouter,
} from "./routes/spacemonkeyMemory.js"
import {
  PrismaClient,
} from "./generated/prisma/client.js"
import {
  createSpacemonkeyDecisionRouter,
} from "./routes/spacemonkeyDecision.js"
import {
  createSpacemonkeyReflectionRouter,
} from "./routes/spacemonkeyReflection.js"
import createAIBrainChatRouter from "./routes/ai-brain-chat.js"
import createAIBrainV2Router from "./routes/ai-brain-v2.js"
import {
  setGitSyncPrisma,
} from "./services/aiBrainV2/services/systemPulse/gitSyncHistory.js"
import createMemoryRouter from "./routes/memory.js"
import {
  startGitSyncWatcher,
} from "./services/aiBrainV2/services/systemPulse/gitSyncWatcher.js"
import {
  startSpacemonkeyImpulseScheduler,
} from "./services/aiBrainV2/system/spacemonkey/spacemonkeyImpulseScheduler.js"
import {
  runSpacemonkeyServerIntegration,
} from "./services/spacemonkey/spacemonkeyServerIntegrationRunner.js"
import systemPulseRouter from "./routes/systemPulse.js"
import systemInstallerSnapshotRouter from "./routes/systemInstallerSnapshot.js"
import {
  createSpacemonkeyAgentSystemRouter,
} from "./routes/spacemonkeyAgentSystem.js"
import {
  createSpacemonkeyWorldModelRouter,
} from "./routes/spacemonkeyWorldModel.js"
import {
  integrateSystemLayer,
} from "./services/systemServerIntegration.js"
import {
  createSpacemonkeyLearningRouter,
} from "./routes/spacemonkeyLearning.js"
import {
  createSpacemonkeyExecutionRouter,
} from "./routes/spacemonkeyExecution.js"
import createDashboardRouter from "./routes/dashboard.js"
import createKnowledgeRouter from "./routes/knowledge.js"
import createKnowledgeUploadRouter from "./routes/knowledge-upload.js"
import createInventoryRouter from "./routes/inventory.js"
import createRemindersRouter from "./routes/reminders.js"
import createPurchasesRouter from "./routes/purchases.js"
import createConversationsRouter from "./routes/conversations.js"
import createAIRouter from "./routes/ai.js"
import createSpacemonkeyBrainStateRouter from "./routes/spacemonkeyBrainState.js"
import createSpacemonkeyBrainwaveRouter from "./routes/spacemonkeyBrainwave.js"
import createSpacemonkeyImpulseRouter from "./routes/spacemonkeyImpulse.js"
import createFilesRouter from "./routes/files.js"
import createMediaEditsRouter, {
  recoverStuckVideoJobs,
} from "./routes/mediaEdits.js"
import createSocialStudioRouter from "./routes/socialStudio.js"
import createWordpressStudioRouter from "./routes/wordpressStudio.js"
import createDevStudioRouter from "./routes/devStudio.js"

import createDevCodeChangeRouter from "./routes/devCodeChangeStudio.js"
import createDevMultiFileChangeRouter from "./routes/devMultiFileChangeStudio.js"
import createAgentChatRouter from "./routes/agentChat.js"
import createProjectsRouter from "./routes/projects.js"
import createProjectMaterialsRouter from "./routes/projectMaterials.js"
import createProjectNotesRouter from "./routes/projectNotes.js"
import createProjectTimelineRouter from "./routes/projectTimeline.js"
import createProjectWorkflowRouter from "./routes/projectWorkflow.js"
import createProjectQuoteRouter from "./routes/projectQuote.js"
import createProjectInvoiceRouter from "./routes/projectInvoice.js"
import createBusinessSettingsRouter from "./routes/businessSettings.js"
import createCustomersRouter from "./routes/customers.js"
import {
  createAgentsRouter,
} from "./routes/agents.js"

import createBackupRouter from "./routes/backup.js"
import createBackupsRouter from "./routes/backups.js"
import createSystemRestoreRouter from "./routes/systemRestore.js"
import recoveryRouter from "./routes/recovery.js"
import {
  integrateToolsLayer,
} from "./services/toolsServerIntegration.js"


import createSpacemonkeyRouter from "./routes/spacemonkey.js"
import {
  createSpacemonkeyGatewayRouter,
} from "./routes/spacemonkeyGateway.js"

import {
  createSpacemonkeyModulesRouter,
} from "./routes/spacemonkeyModules.js"
import {
  createSpacemonkeyRuntimeRouter,
} from "./routes/spacemonkeyRuntime.js"
import {
  createSpacemonkeyCapabilitiesRouter,
} from "./routes/spacemonkeyCapabilities.js"
import {
  createSpacemonkeyApiCatalogRouter,
} from "./routes/spacemonkeyApiCatalog.js"

import {
  createSpacemonkeySnapshotRouter,
} from "./routes/spacemonkeySnapshot.js"


import {
  createSpacemonkeyRestoreRouter,
} from "./routes/spacemonkeyRestore.js"


import {
  createSpacemonkeySafetyRouter,
} from "./routes/spacemonkeySafety.js"


import {
  createSpacemonkeyRestoreApprovalRouter,
} from "./routes/spacemonkeyRestoreApproval.js"


import {
  createSpacemonkeyActivityRouter,
} from "./routes/spacemonkeyActivity.js"


import {
  createSpacemonkeyRestoreDryRunRouter,
} from "./routes/spacemonkeyRestoreDryRun.js"


import {
  createSpacemonkeyIdentityRouter,
} from "./routes/spacemonkeyIdentity.js"



import {
  createSpacemonkeyCoreRouter,
} from "./routes/spacemonkeyCore.js"

import {
  createSpacemonkeyDashboardRouter,
} from "./routes/spacemonkeyDashboard.js"

import {
  createSpacemonkeySnapshotV3ApiRouter,
} from "./routes/spacemonkeySnapshotV3Api.js"



import {
  publicSpacemonkeyRouter,
} from "./routes/spacemonkeyPublic.js"




const prisma =
  new PrismaClient()

setGitSyncPrisma(
  prisma
)

recoverStuckVideoJobs(
  prisma
).catch(
  error =>
    console.error(
      "Jumittuneiden videokäsittelyjen palautus epäonnistui:",
      error,
    )
)

const app =
  express()


// Useita git worktreeja voi olla auki yhtä aikaa, ja Vite ottaa
// automaattisesti seuraavan vapaan portin (5173, 5174, 5175, ...) kun
// edelliset ovat varattuja - kiinteä kahden portin lista jätti kaikki
// muut kehityspalvelimet ilman virheilmoitusta CORS:n taakse (Projektit,
// System Pulse, Dev Studio hajosivat näkymättömästi). Sama
// mikä-tahansa-localhost-portti-periaate kuin Python-backendin
// allow_origin_regex:issä (backend/main.py).
const LOCALHOST_ORIGIN = /^https?:\/\/(localhost|127\.0\.0\.1):\d+$/

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || LOCALHOST_ORIGIN.test(origin)) {
        callback(null, true)
      } else {
        callback(new Error("Not allowed by CORS"))
      }
    },
    credentials:true
  })
)


app.use(
express.json()
)

app.locals.prisma =
  prisma



const PORT =
  process.env.PORT || 3001

 app.use(
  "/api",
  createSpacemonkeyApprovalGatewayRouter()
)
app.use(
    "/api",
    systemInstallerRouter
)
app.use(
  "/api/recovery",
  recoveryRouter
)
app.use(
  "/api",
  createSpacemonkeyPermissionsRouter()
)
app.use(
  "/api",
  createSpacemonkeySecurityCoreRouter()
)
app.use(
  "/api",
  createSpacemonkeyInternetSafetyRouter()
)
app.use(
  "/api",
  createSpacemonkeyPersonalityRuntimeRouter()
)
app.use(
  "/api",
  createSpacemonkeyMemoryRouter()
)
app.use(
  "/api",
  createSpacemonkeySecuritySandboxRouter()
)
app.use(
  "/api",
  createSpacemonkeySecurityReflectionRouter()
)
app.use(
  "/api",
  createSpacemonkeySecurityMemoryRouter()
)
app.use(
  "/api",
  createSpacemonkeySecurityRuntimeRouter()
)
app.use(
  "/api",
  createSpacemonkeySecurityAuditRouter()
)
app.use(
  "/api",
  createSpacemonkeySecurityCapabilitiesRouter()
)
app.use(
  "/api",
  createSpacemonkeyToolSecurityRouter()
)
app.use(
  "/api",
  createSpacemonkeyDockerCapabilityRouter()
)
app.use(
  "/api",
  createSpacemonkeyDatabaseCapabilityRouter()
)
app.use(
  "/api",
  createSpacemonkeyNetworkingCapabilityRouter()
)
app.use(
  "/api",
  createSpacemonkeyLinuxAdvancedCapabilityRouter()
)
app.use(
  "/api",
  createSpacemonkeyCybersecurityCapabilityRouter()
)
app.use(
  "/api",
  createSpacemonkeyAgentSystemRouter()
)
app.use(
"/api/spacemonkey/architecture-health",
architectureHealthRouter
)
app.use(
  "/api",
  createSpacemonkeyCapabilityRegistryRouter()
)
app.use(
  "/api",
  createSpacemonkeySecurityOverviewRouter()
)
app.use(
  "/api",
  createSpacemonkeyExecutionRouter()
)
app.use(
  "/api",
  createSpacemonkeyWorldModelRouter()
  
)
app.use(
  "/uploads",
  express.static(
    path.join(
      path.dirname(
        fileURLToPath(import.meta.url)
      ),
      "uploads"
    )
  )
)
app.use(
  "/api",
  createSpacemonkeyKnowledgeRouter()
)




app.get(
  "/api/database",
  async (
    req,
    res
  )=>{


    try{


      await prisma.$queryRaw`
        SELECT 1
      `


      res.json({

        status:"ok",

        database:"connected"

      })


    }
    catch(error){


      res.status(500).json({

        error:error.message

      })


    }


  }
)





app.get(
  "/api/health",
  (
    req,
    res
  )=>{


    res.json({

      status:"ok",

      service:"Wood-Booster Server",

      message:"API toimii"

    })


  }
)





app.use(
  "/api/ai-brain",
  createAIBrainChatRouter(
    prisma
  )
)



app.use(
  "/api/ai-brain-v2",
  createAIBrainV2Router(
    prisma
  )
)



app.use(
  "/api",
  createMemoryRouter(
    prisma
  )
)



app.use(
  "/api",
  createDashboardRouter(
    prisma
  )
)

app.use(
  "/api",
  createSpacemonkeySecurityPolicyRouter()
)

app.use(
  "/api",
  createKnowledgeRouter(
    prisma
  )
)



app.use(
  "/api",
  createKnowledgeUploadRouter(
    prisma
  )
)



app.use(
  "/api",
  createInventoryRouter(
    prisma
  )
)

app.use(
  "/api",
  createRemindersRouter(
    prisma
  )
)



app.use(
  "/api",
  createPurchasesRouter(
    prisma
  )
)



app.use(
  "/api",
  createConversationsRouter(
    prisma
  )
)



app.use(
  "/api",
  createAIRouter(
    prisma
  )
)



app.use(
  "/api/agents",
  createAgentChatRouter(
    prisma
  )
)



app.use(
  "/api",
  createProjectsRouter(
    prisma
  )
)
app.use(
  "/api",
  createProjectMaterialsRouter(
    prisma
  )
)
app.use(
  "/api",
  createProjectNotesRouter(
    prisma
  )
)
app.use(
  "/api",
  createProjectTimelineRouter(
    prisma
  )
)
app.use(
  "/api",
  createProjectWorkflowRouter(
    prisma
  )
)
app.use(
  "/api",
  createProjectQuoteRouter(
    prisma
  )
)
app.use(
  "/api",
  createProjectInvoiceRouter(
    prisma
  )
)
app.use(
  "/api",
  createCustomersRouter(
    prisma
  )
)
app.use(
  "/api",
  createAgentsRouter()
)



app.use(
  "/api",
  createFilesRouter(
    prisma
  )
)



app.use(
  "/api",
  createMediaEditsRouter(
    prisma
  )
)



app.use(
  "/api",
  createSocialStudioRouter(
    prisma
  )
)



app.use(
  "/api",
  createWordpressStudioRouter(
    prisma
  )
)



app.use(
  "/api",
  createDevStudioRouter(
    prisma
  )
)



app.use(
  "/api",
  createDevCodeChangeRouter(
    prisma
  )
)



app.use(
  "/api",
  createDevMultiFileChangeRouter(
    prisma
  )
)



app.use(
  "/api",
  createBusinessSettingsRouter(
    prisma
  )
)





app.use(
  "/api",
  createBackupRouter()
)



app.use(
  "/api",
  createBackupsRouter()
)

app.use(
  "/api",
  systemPulseRouter
)

app.use(
  "/api",
  createSystemRestoreRouter()
)





app.use(
  "/api",
  createSpacemonkeyIdentityRouter()
)

app.use(
  "/api",
  createSpacemonkeyBrainStateRouter()
)

app.use(
  "/api",
  createSpacemonkeyBrainwaveRouter()
)

app.use(
  "/api",
  createSpacemonkeyImpulseRouter()
)

app.use(
  "/api",
  createSpacemonkeySafetyRouter()
)



app.use(
  "/api",
  createSpacemonkeyCoreRouter()
)



app.use(
  "/api",
  createSpacemonkeySnapshotRouter()
)



app.use(
  "/api",
  createSpacemonkeySnapshotV3ApiRouter()
)



app.use(
  "/api",
  createSpacemonkeyRestoreRouter()
)



app.use(
  "/api",
  createSpacemonkeyRestoreApprovalRouter()
)



app.use(
  "/api",
  createSpacemonkeyRestoreDryRunRouter()
)



app.use(
  "/api",
  createSpacemonkeyActivityRouter()
)



app.use(
  "/api",
  createSpacemonkeyRouter(
    prisma
  )
)

app.use(
  "/api",
  createSpacemonkeyGatewayRouter()
)


app.use(
  "/api",
  createSpacemonkeyApiCatalogRouter()
)
app.use(
  "/api",
  createSpacemonkeyModulesRouter()
  
)
app.use(
  "/api",
  createSpacemonkeyRuntimeRouter()
)
app.use(
  "/api",
  createSpacemonkeyCapabilitiesRouter()
)
app.use(
  "/api",
  createSpacemonkeyReflectionRouter()
)
app.use(
  "/api",
  createSpacemonkeyDecisionRouter()
)
/*
=====================================
PUBLIC INTERNET GATEWAY

Wordpress:
puustaaja.tehopirtti.net

↓

Spacemonkey Public API

=====================================
*/

app.use(
  "/api",
  publicSpacemonkeyRouter
)


app.use(
  "/api",
  createSpacemonkeyDashboardRouter()
)


runSpacemonkeyServerIntegration({
  app
})





integrateSystemLayer(
  app
)


integrateToolsLayer(
  app
)




app.get(
  "/",
  (
    req,
    res
  )=>{


    res.json({

      name:
        "Wood-Booster AI Server",

      status:
        "running"

    })


  }
)

app.use(
"/api/system-installer/restore-approval",
systemInstallerRestoreApprovalRouter
)
app.use(
"/api/spacemonkey/architecture-audit",
architectureAuditRouter
)
app.use(
  "/api",
  createSpacemonkeyLearningRouter()
)
app.use(
"/api/system-installer/snapshot",
systemInstallerSnapshotRouter
)
app.use(
"/api/system-installer/audit",
systemInstallerAuditRouter
)
app.use(
  (
    req,
    res
  )=>{

    res.status(404).json({

      error:
        "Route not found",

      path:
        req.originalUrl

    })


  }
)



app.use(
"/api/system-installer/audit",
systemInstallerAuditRouter
)

app.use(
  (
    error,
    req,
    res,
    next
  )=>{


    console.error(
      "SERVER ERROR:",
      error
    )


    res.status(500).json({

      success:false,

      error:
        error.message,

      code:
        "INTERNAL_SERVER_ERROR"

    })


  }
)





async function start(){


  try{


    await prisma.$connect()

startGitSyncWatcher()

startSpacemonkeyImpulseScheduler({ prisma })

    app.listen(
      PORT,
      ()=>{


        console.log(`

🪵 Wood-Booster Server käynnissä

http://localhost:${PORT}


Public Spacemonkey:
/api/spacemonkey/public


Backup:
/api/backup


Backup History:
/api/backups


System Restore:
/api/system/restore


System Registry:
/api/system/registry


AI Brain V1:
/api/ai-brain


AI Brain V2:
/api/ai-brain-v2


Dashboard:
/api/dashboard

`)


      }
    )


  }
  catch(error){


    console.error(
      "Database connection failed:",
      error
    )


    process.exit(1)


  }


}



start()
