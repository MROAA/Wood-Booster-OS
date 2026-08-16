import express from "express"


import {
  createJournalEntry,
  getJournal,
  getLatestEntries,
  findEntry,
  getLessons,
} from "../services/spacemonkey/modules/creatorJournal/index.js"





function createSpacemonkeyCreatorJournalRouter(){


  const router =
    express.Router()



  router.get(

    "/spacemonkey/creator/journal",

    (req, res)=>{

      try{

        res.json({ success:true, ...getJournal() })

      }
      catch(error){

        console.error("Spacemonkey creator journal error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.get(

    "/spacemonkey/creator/journal/latest",

    (req, res)=>{

      try{

        res.json({ success:true, entries:getLatestEntries() })

      }
      catch(error){

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.get(

    "/spacemonkey/creator/journal/lessons",

    (req, res)=>{

      try{

        res.json({ success:true, lessons:getLessons() })

      }
      catch(error){

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.get(

    "/spacemonkey/creator/journal/:id",

    (req, res)=>{

      try{

        const item =
          findEntry(req.params.id)


        if(!item){

          return res.status(404).json({ success:false, error:"not found" })

        }


        res.json({ success:true, entry:item })

      }
      catch(error){

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.post(

    "/spacemonkey/creator/journal",

    (req, res)=>{

      try{

        const entry =
          createJournalEntry(req.body || {})


        res.json({ success:true, entry })

      }
      catch(error){

        console.error("Spacemonkey creator journal create error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  return router

}





export {

  createSpacemonkeyCreatorJournalRouter

}
