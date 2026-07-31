const MODULE_ID = "architecture-review"



const reviewAreas = [

  {
    id: "structure",

    name:
      "System Structure",

    description:
      "Review module organization and architecture boundaries.",

  },


  {
    id: "dependencies",

    name:
      "Dependencies",

    description:
      "Review relationships between system components.",

  },


  {
    id: "security",

    name:
      "Security",

    description:
      "Review isolation and protection principles.",

  },


  {
    id: "maintainability",

    name:
      "Maintainability",

    description:
      "Review long term development sustainability.",

  },

]



function createArchitectureReview(){

  return {

    moduleId: MODULE_ID,

    timestamp:
      new Date().toISOString(),

    areas:
      reviewAreas,

    count:
      reviewAreas.length,

  }

}



function reviewSystem(component){

  return {

    component,

    status:
      "pending-review",

    message:
      "Architecture review requires analysis.",


    checkedAreas:
      reviewAreas.map(
        area =>
          area.id
      ),

  }

}



function getReviewAreas(){

  return reviewAreas

}



export {

  MODULE_ID,

  createArchitectureReview,

  reviewSystem,

  getReviewAreas,

}
