let activeProject = null



function setActiveProject(project){

  activeProject = {

    id:
      project.id || null,

    name:
      project.name || "Nimetön projekti",

    status:
      project.status || "active",

    goal:
      project.goal || null,

    nextStep:
      project.nextStep || null

  }


  return activeProject

}





function getActiveProject(){

  return activeProject

}





function clearActiveProject(){

  activeProject = null

}





function getActiveProjectStatus(){

  return {

    active:
      Boolean(activeProject),

    project:
      activeProject?.name || null

  }

}





export {

  setActiveProject,

  getActiveProject,

  clearActiveProject,

  getActiveProjectStatus

}
