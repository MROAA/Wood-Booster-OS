const MODULE_ID = "code-review-intelligence"



const reviewCriteria = [

  {
    id: "code-quality",

    name:
      "Code Quality",

    description:
      "Review readability, structure and consistency.",

    priority:
      "high",

  },


  {
    id: "architecture-fit",

    name:
      "Architecture Fit",

    description:
      "Review compatibility with system architecture.",

    priority:
      "high",

  },


  {
    id: "security",

    name:
      "Security Review",

    description:
      "Review possible security concerns.",

    priority:
      "high",

  },


  {
    id: "maintainability",

    name:
      "Maintainability",

    description:
      "Review future modification and expansion.",

    priority:
      "medium",

  },


]



function createCodeReviewFramework(){

  return {

    moduleId: MODULE_ID,

    timestamp:
      new Date().toISOString(),

    criteria:
      reviewCriteria,

    count:
      reviewCriteria.length,

  }

}



function reviewCode(component){

  return {

    component,

    status:
      "pending-review",

    message:
      "Code analysis requires source input.",

    criteria:
      reviewCriteria.map(
        criterion =>
          criterion.id
      ),

  }

}



function getReviewCriteria(){

  return reviewCriteria

}



export {

  MODULE_ID,

  createCodeReviewFramework,

  reviewCode,

  getReviewCriteria,

}
