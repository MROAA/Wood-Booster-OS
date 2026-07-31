const spacemonkeyProjects = [

  {
    id:
      1,

    name:
      "Ei aktiivisia projekteja",

    status:
      "idle",

    goal:
      null,

    nextStep:
      null
  }

]



function getActiveProject(){

  return spacemonkeyProjects.find(
    project =>
      project.status !== "completed"
  )

}



function getProjectSummary(){

  const project =
    getActiveProject()


  if(!project){

    return {

      name:
        "Ei aktiivista projektia",

      goal:
        null,

      nextStep:
        null

    }

  }



  return {

    name:
      project.name,

    goal:
      project.goal,

    nextStep:
      project.nextStep

  }

}



export {

  getActiveProject,

  getProjectSummary

}



export default spacemonkeyProjects
