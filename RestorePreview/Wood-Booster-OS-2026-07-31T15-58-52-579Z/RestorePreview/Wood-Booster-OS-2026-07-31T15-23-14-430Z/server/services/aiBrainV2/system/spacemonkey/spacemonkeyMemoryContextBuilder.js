const contextHistory = []





function buildMemoryContext({

  memories = []

} = {}) {



  const context =

    memories.map(

      memory =>

        ({

          category:

            memory.category,


          importance:

            memory.importance,


          content:

            memory.content

        })

    )







  const result = {


    count:

      context.length,


    memories:

      context,


    createdAt:

      new Date().toISOString()

  }





  contextHistory.push(

    result

  )





  return result

}







function formatMemoryContext({

  memories = []

} = {}) {



  if(
    memories.length === 0
  ){

    return "Ei relevanttia muistia."

  }







  return memories

    .map(

      memory =>

`

Muisti:

Luokka:
${memory.category}

Tärkeys:
${memory.importance}

Sisältö:
${memory.content}

`

    )

    .join("\n")

}







function getMemoryContextStatus(){

  return {


    engine:

      "Spacemonkey Memory Context Builder",


    version:

      "1.0.0",


    contexts:

      contextHistory.length

  }

}







export {

  buildMemoryContext,

  formatMemoryContext,

  getMemoryContextStatus

}
