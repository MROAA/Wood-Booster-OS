export async function readDatabaseKnowledge({
  prisma,
  message,
}) {


  if (!prisma) {
    return []
  }


  try {


    const documents =
      await prisma.knowledgeDocument.findMany({

        where: {
          OR: [

            {
              alwaysUse: true,
            },

            {
              status: "Hyväksytty",
            },

          ],
        },


        orderBy: [

          {
            alwaysUse: "desc",
          },

          {
            priority: "desc",
          },

          {
            confidence: "desc",
          },

        ],


        take: 10,


      })




    const searchWords =
      message
        .toLowerCase()
        .split(" ")
        .filter(
          word => word.length > 3
        )



    const filtered =
      documents.filter(
        doc => {


          if (doc.alwaysUse) {
            return true
          }


          const text =
            `
            ${doc.title}
            ${doc.content}
            ${doc.topic}
            ${doc.tags}
            `
            .toLowerCase()



          return searchWords.some(
            word =>
              text.includes(word)
          )


        }
      )




    return filtered.map(
      doc => ({

        name:
          doc.title,


        content:
          doc.content,


        source:
          "database",


        confidence:
          doc.confidence,

      })
    )



  }


  catch(error) {


    console.error(
      "DATABASE KNOWLEDGE ERROR:",
      error.message
    )


    return []

  }


}