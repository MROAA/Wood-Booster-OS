import express from "express"
import cors from "cors"

import {
  PrismaClient,
} from "./generated/prisma/client.js"


import createAIBrainChatRouter from "./routes/ai-brain-chat.js"
import createMemoryRouter from "./routes/memory.js"

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



const prisma =
  new PrismaClient()



const app =
  express()



const PORT =
  process.env.PORT || 3001




/*
=====================================
MIDDLEWARE
=====================================
*/


app.use(
  cors()
)


app.use(
  express.json()
)




/*
=====================================
DATABASE
=====================================
*/


app.get(
  "/api/database",
  async (req,res)=>{

    try {

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





/*
=====================================
HEALTH
=====================================
*/


app.get(
  "/api/health",
  (req,res)=>{

    res.json({

      status:"ok",

      service:"Wood-Booster Server",

      message:"API toimii"

    })

  }
)





/*
=====================================
AI BRAIN
=====================================
*/


app.use(

  "/api/ai-brain",

  createAIBrainChatRouter(

    prisma

  )

)





/*
=====================================
MEMORY
=====================================
*/


app.use(

  "/api",

  createMemoryRouter(

    prisma

  )

)





/*
=====================================
DASHBOARD
=====================================
*/


app.use(

  "/api",

  createDashboardRouter(

    prisma

  )

)





/*
=====================================
KNOWLEDGE
=====================================
*/


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





/*
=====================================
INVENTORY
=====================================
*/


app.use(

  "/api",

  createInventoryRouter(

    prisma

  )

)





/*
=====================================
PURCHASES
=====================================
*/


app.use(

  "/api",

  createPurchasesRouter(

    prisma

  )

)





/*
=====================================
CONVERSATIONS
=====================================
*/


app.use(

  "/api",

  createConversationsRouter(

    prisma

  )

)





/*
=====================================
AI PROJECT GENERATOR
=====================================
*/


app.use(

  "/api",

  createAIRouter(

    prisma

  )

)





/*
=====================================
AGENTS
=====================================
*/


app.use(

  "/api/agents",

  createAgentChatRouter(

    prisma

  )

)





/*
=====================================
PROJECTS
=====================================
*/


app.use(

  "/api",

  createProjectsRouter(

    prisma

  )

)





/*
=====================================
FILES
=====================================
*/


app.use(

  "/api",

  createFilesRouter(

    prisma

  )

)





/*
=====================================
ROOT
=====================================
*/


app.get(
  "/",
  (req,res)=>{

    res.json({

      name:"Wood-Booster AI Server",

      status:"running"

    })

  }
)





/*
=====================================
404
=====================================
*/


app.use(

  (req,res)=>{

    res.status(404).json({

      error:"Route not found",

      path:req.originalUrl

    })

  }

)





/*
=====================================
ERROR HANDLER
=====================================
*/


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

      error:error.message

    })


  }

)





/*
=====================================
START
=====================================
*/


async function start(){


  try{


    await prisma.$connect()



    app.listen(

      PORT,

      ()=>{


        console.log(

`
🪵 Wood-Booster Server käynnissä

http://localhost:${PORT}


AI Brain:
/api/ai-brain


Memory:
/api/memory


Dashboard:
/api/dashboard


Knowledge:
/api/knowledge


Projects:
/api/projects/:id

`

        )


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
