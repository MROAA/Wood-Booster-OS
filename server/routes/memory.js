import express from "express"

import {
  validateMemory,
} from "../services/memoryValidator.js"





export default function createMemoryRouter(
  prisma
) {


  const router =
    express.Router()







  /*
  =====================================
  GET PENDING PROPOSALS
  =====================================
  */


  router.get(
    "/memory/proposals",
    async (req, res) => {


      try {


        const proposals =

          await prisma.memoryProposal.findMany({

            where: {

              status:
                "pending"

            },


            orderBy: {

              createdAt:
                "desc"

            }

          })



        res.json({

          success:
            true,

          proposals

        })


      }


      catch(error){


        console.error(
          "Memory proposals error:",
          error
        )


        res.status(500).json({

          error:
            error.message

        })


      }


    }
  )









  /*
  =====================================
  APPROVE MEMORY
  =====================================
  */


  router.post(
    "/memory/proposals/:id/approve",
    async (req,res)=>{


      try {


        const id =
          Number(
            req.params.id
          )





        const proposal =

          await prisma.memoryProposal.findUnique({

            where:{
              id
            }

          })







        if(!proposal){


          return res.status(404).json({

            success:false,

            error:
              "Muistiehdotusta ei löytynyt."

          })


        }








        /*
        Estä uudelleen hyväksyntä
        */


        if(
          proposal.status !== "pending"
        ){


          return res.status(400).json({

            success:false,

            error:
              "Muistiehdotus on jo käsitelty.",


            status:
              proposal.status

          })


        }









        /*
        Memory validation
        */


        const validation =

          validateMemory(

            proposal

          )





        if(!validation.valid){


          return res.status(400).json({

            success:false,

            error:
              "Muisti hylättiin validoinnissa.",


            validation

          })


        }









        /*
        Duplicate protection
        */


        const existingMemory =

          await prisma.memory.findFirst({

            where: {

              AND:[

                {

                  key:
                    proposal.key

                },

                {

                  category:
                    proposal.category

                }

              ]

            }

          })







        if(existingMemory){


          return res.status(400).json({

            success:false,

            error:
              "Sama muisti on jo olemassa.",


            existingMemory

          })


        }









        /*
        CREATE MEMORY
        */


        const memory =

          await prisma.memory.create({

            data:{


              category:
                proposal.category,


              key:
                proposal.key,


              content:
                proposal.content,


              importance:
                proposal.importance


            }

          })









        await prisma.memoryProposal.update({

          where:{

            id

          },


          data:{

            status:
              "approved"

          }

        })









        res.json({

          success:true,

          memory,

          validation

        })




      }


      catch(error){


        console.error(

          "Memory approve error:",

          error

        )


        res.status(500).json({

          error:
            error.message

        })


      }


    }
  )









  /*
  =====================================
  REJECT MEMORY
  =====================================
  */


  router.post(
    "/memory/proposals/:id/reject",
    async(req,res)=>{


      try {


        const id =
          Number(
            req.params.id
          )





        const proposal =

          await prisma.memoryProposal.findUnique({

            where:{
              id
            }

          })







        if(!proposal){


          return res.status(404).json({

            success:false,

            error:
              "Muistiehdotusta ei löytynyt."

          })


        }








        await prisma.memoryProposal.update({

          where:{

            id

          },


          data:{

            status:
              "rejected"

          }

        })







        res.json({

          success:true,

          proposal

        })





      }


      catch(error){


        console.error(

          "Memory reject error:",

          error

        )


        res.status(500).json({

          error:
            error.message

        })


      }


    }
  )









  /*
  =====================================
  APPROVED MEMORIES
  =====================================
  */


  router.get(
    "/memory",
    async(req,res)=>{


      try {


        const memories =

          await prisma.memory.findMany({

            orderBy:{

              importance:
                "desc"

            }

          })





        res.json({

          success:true,

          memories

        })





      }


      catch(error){


        res.status(500).json({

          error:
            error.message

        })


      }


    }
  )









  /*
  =====================================
  REJECTED MEMORIES
  =====================================
  */


  router.get(
    "/memory/rejected",
    async(req,res)=>{


      try {


        const memories =

          await prisma.memoryProposal.findMany({

            where:{

              status:
                "rejected"

            },


            orderBy:{

              updatedAt:
                "desc"

            }

          })





        res.json({

          success:true,

          memories

        })





      }


      catch(error){


        res.status(500).json({

          error:
            error.message

        })


      }


    }
  )









  /*
  =====================================
  DELETE MEMORY
  =====================================
  */


  router.delete(
    "/memory/:id",
    async(req,res)=>{


      try {


        const id =
          Number(
            req.params.id
          )





        const memory =

          await prisma.memory.delete({

            where:{
              id
            }

          })





        res.json({

          success:true,

          memory

        })





      }


      catch(error){


        res.status(500).json({

          error:
            error.message

        })


      }


    }
  )








  return router

}