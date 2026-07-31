/*
==================================================

WOOD-BOOSTER AI MEMORY SERVICE
SPACEMONKEY
Pitkäaikaisen muistin keskitetty palvelu.
DUNDEE
Conversation = keskusteluhistoria

MemoryProposal = AI:n ehdottama tieto

Memory = käyttäjän hyväksymä pysyvä tieto

==================================================
*/


function normalizeText(
  value,
) {
  return String(
    value || "",
  )
    .trim()
    .toLowerCase()
    .replace(
      /\s+/g,
      " ",
    )
}


function normalizeCategory(
  category,
) {
  const normalizedCategory =
    normalizeText(
      category,
    )

  return (
    normalizedCategory ||
    "general"
  )
}


function normalizeKey(
  key,
) {
  return normalizeText(
    key,
  )
    .replace(
      /[^a-z0-9åäö_]+/g,
      "_",
    )
    .replace(
      /_+/g,
      "_",
    )
    .replace(
      /^_+|_+$/g,
      "",
    )
}


function normalizeContent(
  content,
) {
  return normalizeText(
    content,
  )
    .replace(
      /[.,!?;:()[\]{}"'`]/g,
      "",
    )
    .replace(
      /\s+/g,
      " ",
    )
    .trim()
}


function normalizeImportance(
  importance,
) {
  const numericImportance =
    Number(
      importance,
    )

  if (
    !Number.isFinite(
      numericImportance,
    )
  ) {
    return 5
  }

  return Math.min(
    10,
    Math.max(
      1,
      Math.round(
        numericImportance,
      ),
    ),
  )
}


async function findMemoryDuplicate({
  prisma,
  category,
  key,
  content,
} = {}) {
  if (!prisma) {
    return {
      duplicate:
        false,

      reason:
        null,

      existingMemory:
        null,
    }
  }

  const normalizedCategory =
    normalizeCategory(
      category,
    )

  const normalizedKey =
    normalizeKey(
      key,
    )

  const normalizedContent =
    normalizeContent(
      content,
    )

  /*
  =====================================
  SAMA CATEGORY + KEY
  =====================================
  */

  if (normalizedKey) {
    const categoryMemories =
      await prisma.memory.findMany({
        where: {
          category:
            normalizedCategory,
        },
      })

    const keyDuplicate =
      categoryMemories.find(
        (memory) =>
          normalizeKey(
            memory.key,
          ) ===
          normalizedKey,
      )

    if (keyDuplicate) {
      return {
        duplicate:
          true,

        reason:
          "same_category_and_key",

        existingMemory:
          keyDuplicate,
      }
    }

    /*
    =====================================
    SAMA SISÄLTÖ ERI AVAIMELLA
    =====================================
    */

    if (normalizedContent) {
      const contentDuplicate =
        categoryMemories.find(
          (memory) =>
            normalizeContent(
              memory.content,
            ) ===
            normalizedContent,
        )

      if (contentDuplicate) {
        return {
          duplicate:
            true,

          reason:
            "same_category_and_content",

          existingMemory:
            contentDuplicate,
        }
      }
    }
  }

  return {
    duplicate:
      false,

    reason:
      null,

    existingMemory:
      null,
  }
}


export async function getMemory({
  prisma,
  category,
  limit = 10,
} = {}) {
  if (!prisma) {
    return []
  }

  try {
    return await prisma.memory.findMany({
      where:
        category
          ? {
              category:
                normalizeCategory(
                  category,
                ),
            }
          : undefined,

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

      take:
        limit,
    })
  }

  catch (error) {
    console.error(
      "MEMORY READ ERROR:",
      error.message,
    )

    return []
  }
}


export async function saveMemorySafely({
  prisma,
  category = "general",
  key,
  content,
  importance = 5,
} = {}) {
  if (!prisma) {
    return {
      success:
        false,

      status:
        "database_missing",

      memory:
        null,

      existingMemory:
        null,

      error:
        "Prisma-tietokantayhteys puuttuu.",
    }
  }

  const normalizedCategory =
    normalizeCategory(
      category,
    )

  const normalizedKey =
    normalizeKey(
      key,
    )

  const cleanContent =
    String(
      content || "",
    ).trim()

  if (!normalizedKey) {
    return {
      success:
        false,

      status:
        "invalid_memory",

      memory:
        null,

      existingMemory:
        null,

      error:
        "Muistin avain puuttuu.",
    }
  }

  if (!cleanContent) {
    return {
      success:
        false,

      status:
        "invalid_memory",

      memory:
        null,

      existingMemory:
        null,

      error:
        "Muistin sisältö puuttuu.",
    }
  }

  try {
    const duplicateResult =
      await findMemoryDuplicate({
        prisma,

        category:
          normalizedCategory,

        key:
          normalizedKey,

        content:
          cleanContent,
      })

    if (
      duplicateResult.duplicate
    ) {
      return {
        success:
          true,

        status:
          "duplicate",

        memory:
          null,

        duplicateReason:
          duplicateResult.reason,

        existingMemory:
          duplicateResult.existingMemory,

        error:
          null,
      }
    }

    const memory =
      await prisma.memory.create({
        data: {
          category:
            normalizedCategory,

          key:
            normalizedKey,

          content:
            cleanContent,

          importance:
            normalizeImportance(
              importance,
            ),
        },
      })

    return {
      success:
        true,

      status:
        "created",

      memory,

      duplicateReason:
        null,

      existingMemory:
        null,

      error:
        null,
    }
  }

  catch (error) {
    console.error(
      "MEMORY SAVE ERROR:",
      error.message,
    )

    return {
      success:
        false,

      status:
        "save_failed",

      memory:
        null,

      existingMemory:
        null,

      error:
        error.message,
    }
  }
}


/*
==================================================

TAKAPERIN YHTEENSOPIVA SAVE MEMORY

Vanha käyttötapa saa edelleen Memory-objektin
tai null-arvon.

Uuden koodin tulee käyttää saveMemorySafely().

==================================================
*/


export async function saveMemory(
  options = {},
) {
  const result =
    await saveMemorySafely(
      options,
    )

  if (
    result.status ===
    "created"
  ) {
    return result.memory
  }

  if (
    result.status ===
    "duplicate"
  ) {
    return result.existingMemory
  }

  return null
}


export {
  findMemoryDuplicate,
  normalizeCategory,
  normalizeContent,
  normalizeImportance,
  normalizeKey,
}
