import {
  setActiveProject,
} from "../data/spacemonkey/spacemonkeyActiveProject"



function activateSpacemonkeyProject(project){


  if(!project){

    return {

      success:false,

      message:
        "No project provided."

    }

  }




  const activeProject =
    setActiveProject({

      id:
        project.id,

      name:
        project.name,

      status:
        project.status,

      goal:
        project.goal ||
        project.description ||
        null,

      nextStep:
        "Projektin työvaiheiden tarkistus."

    })





  return {

    success:true,

    project:
      activeProject

  }

}





function clearSpacemonkeyProject(){

  return {

    success:true,

    message:
      "Spacemonkey project cleared."

  }

}





export {

  activateSpacemonkeyProject,

  clearSpacemonkeyProject

}
