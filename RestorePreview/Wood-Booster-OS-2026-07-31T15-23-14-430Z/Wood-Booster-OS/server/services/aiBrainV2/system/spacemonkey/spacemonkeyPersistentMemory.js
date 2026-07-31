const memorySaveHistory = []



function normalizeImportance(level){

  if(level === "high"){
    return 10
  }


  if(level === "medium"){
    return 7
  }


  return 3

}



async function saveMemory({

  prisma,

  category =
    "spacemonkey",


  key,

  content,

  importance =
    "medium"

}) {


  if(
    !prisma
  ){

    return {

      saved:
        false,

      reason:
        "Database connection missing."

    }

  }



  const memory =

    await prisma.memory.create({

      data:{

        category,

        key,

        content,

        importance:
          normalizeImportance(
            importance
          )

      }

    })



  memorySaveHistory.push(

    memory

  )



  return {

    saved:
      true,

    memory

  }

}



async function findMemory({

  prisma,

  category =
    "spacemonkey"

}) {


  if(
    !prisma
  ){

    return []

  }



  return await prisma.memory.findMany({

    where:{

      category

    },


    orderBy:{

      createdAt:
        "desc"

    }

  })

}



function getPersistentMemoryStatus(){

  return {

    engine:
      "Spacemonkey Persistent Memory",


    version:
      "0.1.0",


    saved:
      memorySaveHistory.length

  }

}



export {

  saveMemory,

  findMemory,

  getPersistentMemoryStatus

}
