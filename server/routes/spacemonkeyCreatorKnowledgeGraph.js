import express from "express"


import {
  addNode,
  addConnection,
  getGraph,
  findNode,
  getConnectionsForNode,
  getNodesByType,
} from "../services/spacemonkey/modules/creatorKnowledgeGraph/index.js"





function createSpacemonkeyCreatorKnowledgeGraphRouter(){


  const router =
    express.Router()



  router.get(

    "/spacemonkey/creator/knowledge-graph",

    (req, res)=>{

      try{

        const type =
          req.query.type


        const data =
          type
            ? { moduleId: "creator-knowledge-graph", nodes: getNodesByType(type) }
            : getGraph()


        res.json({ success:true, ...data })

      }
      catch(error){

        console.error("Spacemonkey creator knowledge graph error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.get(

    "/spacemonkey/creator/knowledge-graph/node/:id",

    (req, res)=>{

      try{

        const node =
          findNode(req.params.id)


        if(!node){

          return res.status(404).json({ success:false, error:"not found" })

        }


        res.json({

          success:true,

          node,

          connections:getConnectionsForNode(req.params.id),

        })

      }
      catch(error){

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.post(

    "/spacemonkey/creator/knowledge-graph/node",

    (req, res)=>{

      try{

        const node =
          addNode(req.body || {})


        res.json({ success:true, node })

      }
      catch(error){

        console.error("Spacemonkey creator knowledge graph add node error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.post(

    "/spacemonkey/creator/knowledge-graph/connection",

    (req, res)=>{

      try{

        const connection =
          addConnection(req.body || {})


        res.json({ success:true, connection })

      }
      catch(error){

        console.error("Spacemonkey creator knowledge graph add connection error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  return router

}





export {

  createSpacemonkeyCreatorKnowledgeGraphRouter

}
