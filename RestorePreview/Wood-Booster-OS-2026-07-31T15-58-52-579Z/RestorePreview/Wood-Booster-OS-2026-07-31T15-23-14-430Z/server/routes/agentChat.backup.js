import express from "express"


import {
  buildAgentContext
} from "../services/agentExecutor.js"


import {
  runAIBrain
} from "../services/aiBrain.js"




export default function createAgentChatRouter(prisma){


const router = express.Router()





router.post(

"/chat",

async (req,res)=>{


try {


const {

message

} = req.body





if(!message){


return res.status(400).json({

success:false,

error:"Message puuttuu"

})


}






const agent =

buildAgentContext(

message

)







const result =

await runAIBrain({

message,

knowledge:[],

conversation:[],

prisma

})







res.json({

success:true,

agent:agent.agent,

reason:agent.reason,

answer:result.answer,

debug:result.debug

})





}

catch(error){


console.error(

"AGENT CHAT ERROR:",

error

)


res.status(500).json({

success:false,

error:error.message

})


}


}


)





return router


}
