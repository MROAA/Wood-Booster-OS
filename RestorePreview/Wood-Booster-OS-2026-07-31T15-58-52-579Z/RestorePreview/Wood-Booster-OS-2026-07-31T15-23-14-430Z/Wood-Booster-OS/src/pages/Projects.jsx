import { useEffect, useState } from "react"
import { apiGet } from "../api/client"
import { Link } from "react-router-dom"

import AIProjectGenerator from "../components/projects/AIProjectGenerator"



function Projects(){

  const [projects,setProjects] = useState([])
  const [loading,setLoading] = useState(true)



  async function loadProjects(){

    try{

      const data = await apiGet(
        "/dashboard"
      )


      setProjects(
        data.projects || []
      )


    }

    catch(error){

      console.error(
        "Projects error:",
        error
      )

    }

    finally{

      setLoading(false)

    }

  }



  useEffect(()=>{

    loadProjects()

  },[])




  return (

    <div className="space-y-8">


      <header>

        <p className="
        text-sm
        uppercase
        tracking-[0.25em]
        text-amber-500
        ">

          Project OS

        </p>


        <h1 className="
        mt-2
        text-4xl
        font-bold
        ">

          📦 Projects

        </h1>


        <p className="
        mt-3
        text-neutral-400
        ">

          Wood-Booster projektien hallinta.

        </p>


      </header>




      <AIProjectGenerator
        onCreated={loadProjects}
      />





      <section className="
      grid
      grid-cols-1
      md:grid-cols-3
      gap-4
      ">


        <StatCard
          title="Projects"
          value={projects.length}
        />


        <StatCard
          title="Backend"
          value="CONNECTED"
        />


        <StatCard
          title="AI"
          value="READY"
        />


      </section>






      {
        loading &&

        <div className="
        rounded-2xl
        border
        border-neutral-800
        bg-neutral-900
        p-6
        ">

          Ladataan projekteja...

        </div>

      }





      <div className="
      grid
      grid-cols-1
      xl:grid-cols-2
      gap-6
      ">


        {
          projects.map(project => (

            <ProjectCard

              key={project.id}

              project={project}

            />

          ))

        }


      </div>



    </div>

  )

}





function StatCard({
  title,
  value
}){

return (

<div className="
rounded-2xl
border
border-neutral-800
bg-neutral-900
p-5
">

<p className="text-neutral-500">
{title}
</p>


<p className="
mt-2
text-3xl
font-bold
">

{value}

</p>


</div>

)

}





function ProjectCard({
project
}){


return (

<div className="
rounded-2xl
border
border-neutral-800
bg-neutral-900
p-6
">


<h2 className="
text-xl
font-bold
">

{project.name}

</h2>



<p className="
mt-3
text-neutral-400
">

Status:

{" "}

{project.status}

</p>




<p className="
mt-3
text-neutral-500
text-sm
">

ID:
{" "}
{project.id}

</p>




<Link

to={`/projects/${project.id}`}

className="
inline-block
mt-6
rounded-xl
bg-amber-500
px-5
py-3
font-bold
text-black
"

>

Avaa projekti

</Link>



</div>

)

}



export default Projects
