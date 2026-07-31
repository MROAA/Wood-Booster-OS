import {
  useState,
} from "react"





const modules = [

  {
    id:
      "ai-brain",

    name:
      "AI Brain",

    version:
      "1.0.0",

    status:
      "ACTIVE",

    description:
      "Wood-Booster AI päätöksenteko ja keskustelumoottori.",
  },


  {
    id:
      "memory",

    name:
      "Memory",

    version:
      "1.0.0",

    status:
      "ACTIVE",

    description:
      "Muistijärjestelmä ja oppimisen tietovarasto.",
  },


  {
    id:
      "knowledge",

    name:
      "Knowledge",

    version:
      "1.0.0",

    status:
      "READY",

    description:
      "Tietopankki ja lähdeaineistojen hallinta.",
  },


  {
    id:
      "truth-layer",

    name:
      "Truth Layer",

    version:
      "1.0.0",

    status:
      "ACTIVE",

    description:
      "Fakta- ja validointikerros.",
  },


  {
    id:
      "security",

    name:
      "Security",

    version:
      "1.0.0",

    status:
      "ACTIVE",

    description:
      "Turvallisuus, palautus ja suojaus.",
  },


  {
    id:
      "backup",

    name:
      "Backup",

    version:
      "1.0.0",

    status:
      "ACTIVE",

    description:
      "Järjestelmän varmistukset ja snapshotit.",
  },

]







function SpacemonkeyModuleRegistry(){


  const [
    selected,
    setSelected,
  ] = useState(null)







  return (

    <section className="
      rounded-2xl
      border
      border-neutral-800
      bg-neutral-900
      p-6
    ">


      <header>


        <h2 className="
          text-xl
          font-bold
          text-white
        ">

          Module Registry

        </h2>



        <p className="
          mt-2
          text-sm
          text-neutral-400
        ">

          Spacemonkey system module overview.

        </p>


      </header>







      <div className="
        mt-6
        grid
        grid-cols-1
        gap-4
        md:grid-cols-2
        xl:grid-cols-3
      ">


        {
          modules.map(

            module => (

              <ModuleCard

                key={
                  module.id
                }

                module={
                  module
                }

                selected={
                  selected
                }

                setSelected={
                  setSelected
                }

              />

            )

          )
        }


      </div>







      {
        selected && (

          <div className="
            mt-6
            rounded-xl
            border
            border-neutral-800
            bg-black/30
            p-5
          ">


            <h3 className="
              font-bold
              text-white
            ">

              {selected.name}

            </h3>


            <p className="
              mt-2
              text-neutral-400
            ">

              {selected.description}

            </p>


            <div className="
              mt-4
              text-sm
              text-neutral-500
            ">


              Version:
              {" "}
              {selected.version}


            </div>


          </div>

        )

      }


    </section>

  )

}







function ModuleCard({
  module,
  selected,
  setSelected,
}){


  const active =
    selected?.id === module.id







  return (

    <button

      onClick={()=>setSelected(module)}

      className={`
        text-left
        rounded-xl
        border
        p-5
        transition-colors
        ${
          active
          ? "border-neutral-600"
          : "border-neutral-800"
        }
        hover:border-neutral-700
      `}

    >


      <div className="
        flex
        items-center
        justify-between
      ">


        <h3 className="
          font-semibold
          text-white
        ">

          {module.name}

        </h3>


        <Status

          status={
            module.status
          }

        />


      </div>







      <p className="
        mt-3
        text-sm
        text-neutral-400
      ">

        {module.description}

      </p>







      <p className="
        mt-4
        text-xs
        text-neutral-500
      ">

        Version:
        {" "}
        {module.version}

      </p>


    </button>

  )

}







function Status({
  status,
}){


  return (

    <span className="
      flex
      items-center
      gap-2
      text-xs
      text-green-400
    ">


      <span className="
        h-2
        w-2
        rounded-full
        bg-green-400
      "/>


      {status}


    </span>

  )

}







export default SpacemonkeyModuleRegistry
