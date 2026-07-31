const improvementMemory = []



function saveImprovement({

  reflection,

  lesson,

  category

}) {


  const memory = {


    id:

      `improvement-${Date.now()}`,


    category:

      category || "development",


    lesson:

      lesson || createLesson(reflection),


    source:

      reflection?.taskId || null,


    importance:

      calculateImportance({

        reflection

      }),


    createdAt:

      new Date().toISOString()

  }



  improvementMemory.push(

    memory

  )



  return memory

}





function createLesson(reflection){


  if(

    reflection?.improvements?.length

  ){

    return reflection.improvements.join(

      " "

    )

  }



  return "Ei määriteltyä kehitysoppia."

}





function calculateImportance({

  reflection

}) {


  if(

    reflection?.evaluation === "success"

  ){

    return 8

  }



  if(

    reflection?.evaluation === "needs_review"

  ){

    return 6

  }



  return 5

}





function findImprovements({

  category

}) {


  if(!category){

    return [

      ...improvementMemory

    ]

  }



  return improvementMemory.filter(

    item =>

      item.category === category

  )

}





function getImprovementMemory(){


  return [

    ...improvementMemory

  ]

}





function getImprovementMemoryStatus(){


  return {


    engine:

      "Spacemonkey Improvement Memory Engine",


    version:

      "0.1.0",


    memories:

      improvementMemory.length

  }

}



export {

  saveImprovement,

  findImprovements,

  getImprovementMemory,

  getImprovementMemoryStatus

}
