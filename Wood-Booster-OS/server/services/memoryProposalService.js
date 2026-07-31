import prisma from "../prisma.js"

import {
  saveMemorySafely,
} from "./memoryService.js"


/*
==================================================

WOOD-BOOSTER MEMORY PROPOSAL SERVICE
PERSBABA CROCODILE DUNDEE
Proposal = AI:n ehdotus
SPACEMONKEYFIGHTCLUB
Memory = käyttäjän hyväksymä pysyvä tieto

==================================================
*/


function resolveDatabase(
  prismaClient,
) {
  return (
    prismaClient ||
    prisma
  )
}


function normalizeProposalId(
  id,
) {
  const numericId =
    Number(
      id,
    )

  if (
    !Number.isInteger(
      numericId,
    ) ||
    numericId <= 0
  ) {
    return null
  }

  return numericId
}


export async function createMemoryProposal({
  prismaClient,
  memory,
} = {}) {
  const database =
    resolveDatabase(
      prismaClient,
    )

  if (
    !database ||
    !memory
  ) {
    return null
  }

  try {
    return await database
      .memoryProposal
      .create({
        data: {
          category:
            memory.category ||
            "general",

          key:
            memory.key,

          content:
            memory.content,

          importance:
            memory.importance ||
            5,
        },
      })
  }

  catch (error) {
    console.error(
      "CREATE MEMORY PROPOSAL ERROR:",
      error.message,
    )

    return null
  }
}


export async function getPendingProposals({
  prismaClient,
} = {}) {
  const database =
    resolveDatabase(
      prismaClient,
    )

  if (!database) {
    return []
  }

  try {
    return await database
      .memoryProposal
      .findMany({
        where: {
          status:
            "pending",
        },

        orderBy: {
          createdAt:
            "desc",
        },
      })
  }

  catch (error) {
    console.error(
      "GET MEMORY PROPOSALS ERROR:",
      error.message,
    )

    return []
  }
}


export async function approveMemoryProposal(
  id,
  {
    prismaClient,
  } = {},
) {
  const database =
    resolveDatabase(
      prismaClient,
    )

  const proposalId =
    normalizeProposalId(
      id,
    )

  if (
    !database ||
    !proposalId
  ) {
    return {
      success:
        false,

      status:
        "invalid_request",

      memory:
        null,

      proposal:
        null,

      existingMemory:
        null,

      error:
        "Virheellinen muistiehdotuksen tunniste.",
    }
  }

  try {
    const proposal =
      await database
        .memoryProposal
        .findUnique({
          where: {
            id:
              proposalId,
          },
        })

    if (!proposal) {
      return {
        success:
          false,

        status:
          "not_found",

        memory:
          null,

        proposal:
          null,

        existingMemory:
          null,

        error:
          "Muistiehdotusta ei löytynyt.",
      }
    }

    if (
      proposal.status !==
      "pending"
    ) {
      return {
        success:
          false,

        status:
          "already_processed",

        memory:
          null,

        proposal,

        existingMemory:
          null,

        error:
          "Muistiehdotus on jo käsitelty.",
      }
    }

    const saveResult =
      await saveMemorySafely({
        prisma:
          database,

        category:
          proposal.category,

        key:
          proposal.key,

        content:
          proposal.content,

        importance:
          proposal.importance,
      })

    if (!saveResult.success) {
      return {
        success:
          false,

        status:
          saveResult.status,

        memory:
          null,

        proposal,

        existingMemory:
          saveResult.existingMemory ||
          null,

        error:
          saveResult.error ||
          "Muistin tallennus epäonnistui.",
      }
    }

    const updatedProposal =
      await database
        .memoryProposal
        .update({
          where: {
            id:
              proposalId,
          },

          data: {
            status:
              saveResult.status ===
              "duplicate"
                ? "duplicate"
                : "approved",
          },
        })

    return {
      success:
        true,

      status:
        saveResult.status,

      memory:
        saveResult.memory,

      proposal:
        updatedProposal,

      duplicateReason:
        saveResult
          .duplicateReason ||
        null,

      existingMemory:
        saveResult
          .existingMemory ||
        null,

      error:
        null,
    }
  }

  catch (error) {
    console.error(
      "APPROVE MEMORY ERROR:",
      error.message,
    )

    return {
      success:
        false,

      status:
        "approval_failed",

      memory:
        null,

      proposal:
        null,

      existingMemory:
        null,

      error:
        error.message,
    }
  }
}


export async function rejectMemoryProposal(
  id,
  {
    prismaClient,
  } = {},
) {
  const database =
    resolveDatabase(
      prismaClient,
    )

  const proposalId =
    normalizeProposalId(
      id,
    )

  if (
    !database ||
    !proposalId
  ) {
    return {
      success:
        false,

      status:
        "invalid_request",

      proposal:
        null,

      error:
        "Virheellinen muistiehdotuksen tunniste.",
    }
  }

  try {
    const proposal =
      await database
        .memoryProposal
        .findUnique({
          where: {
            id:
              proposalId,
          },
        })

    if (!proposal) {
      return {
        success:
          false,

        status:
          "not_found",

        proposal:
          null,

        error:
          "Muistiehdotusta ei löytynyt.",
      }
    }

    if (
      proposal.status !==
      "pending"
    ) {
      return {
        success:
          false,

        status:
          "already_processed",

        proposal,

        error:
          "Muistiehdotus on jo käsitelty.",
      }
    }

    const rejectedProposal =
      await database
        .memoryProposal
        .update({
          where: {
            id:
              proposalId,
          },

          data: {
            status:
              "rejected",
          },
        })

    return {
      success:
        true,

      status:
        "rejected",

      proposal:
        rejectedProposal,

      error:
        null,
    }
  }

  catch (error) {
    console.error(
      "REJECT MEMORY ERROR:",
      error.message,
    )

    return {
      success:
        false,

      status:
        "rejection_failed",

      proposal:
        null,

      error:
        error.message,
    }
  }
}
