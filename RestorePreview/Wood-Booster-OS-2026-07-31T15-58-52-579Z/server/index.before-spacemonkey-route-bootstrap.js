import express from "express"
import cors from "cors"

import {
  PrismaClient,
} from "./generated/prisma/client.js"


import createAIBrainChatRouter from "./routes/ai-brain-chat.js"
import createAIBrainV2Router from "./routes/ai-brain-v2.js"
import createMemoryRouter from "./routes/memory.js"

import {
  runSpacemonkeyServerIntegration,
} from "./services/spacemonkey/spacemonkeyServerIntegrationRunner.js"


import {
  integrateSystemLayer,
} from "./services/systemServerIntegration.js"


import createDashboardRouter from "./routes/dashboard.js"
import createKnowledgeRouter from "./routes/knowledge.js"
import createKnowledgeUploadRouter from "./routes/knowledge-upload.js"
import createInventoryRouter from "./routes/inventory.js"
import createPurchasesRouter from "./routes/purchases.js"
import createConversationsRouter from "./routes/conversations.js"
import createAIRouter from "./routes/ai.js"
import createFilesRouter from "./routes/files.js"
import createAgentChatRouter from "./routes/agentChat.js"
import createProjectsRouter from "./routes/projects.js"


import createBackupRouter from "./routes/backup.js"
import createBackupsRouter from "./routes/backups.js"
import createSystemRestoreRouter from "./routes/systemRestore.js"



import createSpacemonkeyRouter from "./routes/spacemonkey.js"


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
  createSpacemonkeySnapshotV3ApiRouter,
} from "./routes/spacemonkeySnapshotV3Api.js"




const prisma =
  new PrismaClient()



const app =
  express()



app.locals.prisma =
  prisma



const PORT =
  process.env.PORT || 3001




app.use(
  cors()
)



app.use(
  express.json()
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
  createFilesRouter(
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
  createSystemRestoreRouter()
)





app.use(
  "/api",
  createSpacemonkeyIdentityRouter()
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





runSpacemonkeyServerIntegration({
  app
})





integrateSystemLayer(
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



    app.listen(
      PORT,
      ()=>{


        console.log(`

🪵 Wood-Booster Server käynnissä

http://localhost:${PORT}


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
