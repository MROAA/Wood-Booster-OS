/*
 * Keskusteluhistorian pysyvyys chat-tiloille (/spacemonkey /altrako
 * /council), olemassa olevien Conversation/Message-mallien päällä
 * (server/prisma/schema.prisma) - ei erillistä JSON-tiedostoa, jotta
 * käytetään samaa tietokantaa kuin muukin sovellus.
 *
 * Yksi jatkuva Conversation koko chatille, koska nykyisessä
 * käyttöliittymässä (ChatPanel.jsx) ei ole keskustelun vaihtoa - sama
 * yhden jatkuvan lokin malli kuin PR #11:n alkuperäisessä
 * JSON-historiassa.
 */

const CONVERSATION_TITLE = "Spacemonkey Chat"

async function getOrCreateConversation(prisma) {
  const existing = await prisma.conversation.findFirst({
    where: { title: CONVERSATION_TITLE },
    orderBy: { createdAt: "asc" },
  })

  if (existing) {
    return existing
  }

  return prisma.conversation.create({
    data: { title: CONVERSATION_TITLE },
  })
}

export async function loadChatHistory(prisma, limit = 50) {
  const conversation = await getOrCreateConversation(prisma)

  const messages = await prisma.message.findMany({
    where: { conversationId: conversation.id },
    orderBy: { createdAt: "asc" },
  })

  return messages.slice(-limit)
}

export async function appendChatTurn(prisma, { userText, mode, reply }) {
  const conversation = await getOrCreateConversation(prisma)

  await prisma.message.create({
    data: {
      conversationId: conversation.id,
      role: "user",
      content: userText,
      mode,
    },
  })

  await prisma.message.create({
    data: {
      conversationId: conversation.id,
      role: "assistant",
      content: reply,
      mode,
    },
  })
}
