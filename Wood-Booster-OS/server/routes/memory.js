import express from "express"

import {
  approveMemoryProposal,
  getPendingProposals,
  rejectMemoryProposal,
} from "../services/memoryProposalService.js"

import {
  validateMemory,
} from "../services/memoryValidator.js"


export default function createMemoryRouter(
  prisma,
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
          await getPendingProposals({
            prismaClient:
              prisma,
          })

        res.json({
          success:
            true,

          proposals,
        })
      }

      catch (error) {
        console.error(
          "Memory proposals error:",
          error,
        )

        res.status(500).json({
          success:
            false,

          error:
            error.message,
        })
      }
    },
  )


  /*
  =====================================
  APPROVE MEMORY
  =====================================
  */


  router.post(
    "/memory/proposals/:id/approve",
    async (req, res) => {
      try {
        const id =
          Number(
            req.params.id,
          )

        const proposal =
          await prisma
            .memoryProposal
            .findUnique({
              where: {
                id,
              },
            })

        if (!proposal) {
          return res.status(404).json({
            success:
              false,

            error:
              "Muistiehdotusta ei löytynyt.",
          })
        }

        const validation =
          validateMemory(
            proposal,
          )

        if (!validation.valid) {
          return res.status(400).json({
            success:
              false,

            error:
              "Muisti hylättiin validoinnissa.",

            validation,
          })
        }

        const result =
          await approveMemoryProposal(
            id,
            {
              prismaClient:
                prisma,
            },
          )

        if (!result.success) {
          const statusCode =
            result.status ===
            "not_found"
              ? 404
              : 400

          return res
            .status(
              statusCode,
            )
            .json({
              ...result,
              validation,
            })
        }

        res.json({
          ...result,
          validation,
        })
      }

      catch (error) {
        console.error(
          "Memory approve error:",
          error,
        )

        res.status(500).json({
          success:
            false,

          error:
            error.message,
        })
      }
    },
  )


  /*
  =====================================
  REJECT MEMORY SPACEMONKEY
  =====================================
  */


  router.post(
    "/memory/proposals/:id/reject",
    async (req, res) => {
      try {
        const result =
          await rejectMemoryProposal(
            req.params.id,
            {
              prismaClient:
                prisma,
            },
          )

        if (!result.success) {
          const statusCode =
            result.status ===
            "not_found"
              ? 404
              : 400

          return res
            .status(
              statusCode,
            )
            .json(
              result,
            )
        }

        res.json(
          result,
        )
      }

      catch (error) {
        console.error(
          "Memory reject error:",
          error,
        )

        res.status(500).json({
          success:
            false,

          error:
            error.message,
        })
      }
    },
  )


  /*
  =====================================
  APPROVED MEMORIES
  =====================================
  */


  router.get(
    "/memory",
    async (req, res) => {
      try {
        const memories =
          await prisma
            .memory
            .findMany({
              orderBy: [
                {
                  importance:
                    "desc",
                },

                {
                  updatedAt:
                    "desc",
                },
              ],
            })

        res.json({
          success:
            true,

          memories,
        })
      }

      catch (error) {
        res.status(500).json({
          success:
            false,

          error:
            error.message,
        })
      }
    },
  )


  /*
  =====================================
  REJECTED MEMORIES
  =====================================
  */


  router.get(
    "/memory/rejected",
    async (req, res) => {
      try {
        const memories =
          await prisma
            .memoryProposal
            .findMany({
              where: {
                status:
                  "rejected",
              },

              orderBy: {
                updatedAt:
                  "desc",
              },
            })

        res.json({
          success:
            true,

          memories,
        })
      }

      catch (error) {
        res.status(500).json({
          success:
            false,

          error:
            error.message,
        })
      }
    },
  )


  /*
  =====================================
  DELETE MEMORY
  =====================================
  */


  router.delete(
    "/memory/:id",
    async (req, res) => {
      try {
        const id =
          Number(
            req.params.id,
          )

        const memory =
          await prisma
            .memory
            .delete({
              where: {
                id,
              },
            })

        res.json({
          success:
            true,

          memory,
        })
      }

      catch (error) {
        res.status(500).json({
          success:
            false,

          error:
            error.message,
        })
      }
    },
  )


  return router
}
