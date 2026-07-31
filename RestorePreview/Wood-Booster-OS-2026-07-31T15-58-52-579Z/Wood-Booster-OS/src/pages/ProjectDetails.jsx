import {
  Link,
  useParams,
} from "react-router-dom"

import {
  useEffect,
  useState,
} from "react"

import {
  apiGet,
} from "../api/client"

import ProjectTabs from "../components/ProjectTabs"

import {
  clearActiveCustomer,
  clearActiveProject,
  setActiveCustomer,
  setActiveProject,
  setAvailableActions,
} from "../services/runtime/runtimeContext"

import {
  setActiveProject as setSpacemonkeyProject,
} from "../data/spacemonkey/spacemonkeyActiveProject"



function ProjectDetails() {


  const { id } = useParams()


  const [project, setProject] =
    useState(null)


  const [loading, setLoading] =
    useState(true)


  const [error, setError] =
    useState("")





  useEffect(() => {


    let cancelled = false



    async function loadProject(){


      setLoading(true)

      setError("")


      clearActiveProject()

      clearActiveCustomer()



      try {


        const data =
          await apiGet(
            `/projects/${id}`,
          )


        const loadedProject =
          data?.project || data



        if(!loadedProject?.id){

          throw new Error(
            "Backend ei palauttanut projektia.",
          )

        }



        if(!cancelled){

          setProject(
            loadedProject,
          )

        }


      }

      catch(loadError){


        console.error(
          "Project loading error:",
          loadError,
        )


        if(!cancelled){

          setProject(null)

          setError(
            loadError?.message ||
            "Projektin lataaminen epäonnistui.",
          )

        }

      }


      finally{


        if(!cancelled){

          setLoading(false)

        }


      }


    }



    loadProject()



    return () => {

      cancelled = true

      clearActiveProject()

      clearActiveCustomer()

      setAvailableActions([])

    }


  },[id])







  useEffect(()=>{


    if(!project?.id){

      return

    }





    setActiveProject({

      id:
        project.id,

      name:
        project.name ||
        "Nimetön projekti",

      status:
        project.status ||
        null,

      notes:
        project.notes ||
        null,

      customerId:
        project.customerId ||
        project.customer?.id ||
        null,

    })





    setSpacemonkeyProject({

      id:
        project.id,

      name:
        project.name,

      status:
        project.status,

      goal:
        project.notes ||

        "Projektin eteneminen",

      nextStep:
        "Projektin seuraava työvaihe"

    })





    if(project.customer){


      setActiveCustomer({

        id:
          project.customer.id,

        name:
          project.customer.name,

        email:
          project.customer.email,

        phone:
          project.customer.phone,

        company:
          project.customer.company,

      })


    }

    else{


      clearActiveCustomer()


    }





    setAvailableActions([

      {
        type:"navigate",
        label:"Avaa projektit",
        path:"/projects",
      },


      {
        type:"open_project_tab",
        label:"Avaa projektin yleisnäkymä",
        tab:"overview",
      },


      {
        type:"open_project_tab",
        label:"Avaa materiaalit",
        tab:"materials",
      },


      {
        type:"open_project_tab",
        label:"Avaa tiedostot",
        tab:"files",
      },


      {
        type:"open_project_tab",
        label:"Avaa muistiinpanot",
        tab:"notes",
      },


      {
        type:"open_project_tab",
        label:"Avaa aikajana",
        tab:"timeline",
      },


      {
        type:"open_project_tab",
        label:"Avaa galleria",
        tab:"gallery",
      },


      {
        type:"open_project_tab",
        label:"Avaa työnkulku",
        tab:"workflow",
      },


      {
        type:"open_project_tab",
        label:"Avaa tarjous",
        tab:"quote",
      },


    ])


  },[project])







  if(loading){

    return (

      <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">

        Ladataan projektia...

      </div>

    )

  }







  if(error){

    return (

      <div className="space-y-5">

        <Link
          to="/projects"
          className="text-amber-400"
        >
          ← Projects
        </Link>


        <div className="rounded-2xl border border-red-900 bg-red-950/40 p-6">

          {error}

        </div>


      </div>

    )

  }







  if(!project){

    return (

      <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">

        Projektia ei löytynyt.

      </div>

    )

  }







  return (

    <div className="space-y-8">


      <Link
        to="/projects"
        className="text-amber-400"
      >

        ← Projects

      </Link>





      <header>

        <p className="text-sm uppercase tracking-[0.25em] text-amber-500">

          Project OS

        </p>


        <h1 className="mt-3 text-4xl font-bold">

          📦 {project.name}

        </h1>


      </header>





      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">


        <Card
          title="Status"
          value={
            project.status ||
            "Ei tilaa"
          }
        />



        <Card
          title="Customer"
          value={
            project.customer?.name ||
            "Ei asiakasta"
          }
        />



        <Card
          title="Spacemonkey"
          value="Aktiivinen"
        />


      </div>





      <ProjectTabs

        project={project}

        onProjectUpdated={
          setProject
        }

      />



    </div>

  )

}





function Card({
  title,
  value,
}){

  return (

    <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5">

      <p className="text-neutral-500">

        {title}

      </p>


      <p className="mt-2 break-words text-xl font-bold">

        {value}

      </p>


    </div>

  )

}



export default ProjectDetails
