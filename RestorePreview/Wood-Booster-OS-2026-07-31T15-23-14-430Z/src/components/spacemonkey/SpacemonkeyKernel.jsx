const kernelSystems = [

  {
    name:
      "Core",

    status:
      "READY",

    description:
      "Spacemonkey pääjärjestelmäydin.",
  },


  {
    name:
      "AI Brain",

    status:
      "READY",

    description:
      "Tekoälyn päätöksenteko ja agenttijärjestelmä.",
  },


  {
    name:
      "Memory Engine",

    status:
      "READY",

    description:
      "Muistin tallennus ja palautus.",
  },


  {
    name:
      "Knowledge Engine",

    status:
      "READY",

    description:
      "Tietopankki ja tiedonhallinta.",
  },


  {
    name:
      "Security Layer",

    status:
      "ACTIVE",

    description:
      "Turvallisuus, validointi ja suojaus.",
  },


  {
    name:
      "Recovery System",

    status:
      "ACTIVE",

    description:
      "Snapshotit ja järjestelmän palautus.",
  },

]







function SpacemonkeyKernel(){


  return (

    <section className="
      rounded-2xl
      border
      border-neutral-800
      bg-neutral-900
      p-6
      transition-colors
      hover:border-neutral-700
    ">


      <header>


        <h2 className="
          text-xl
          font-bold
          text-white
        ">

          Kernel

        </h2>



        <p className="
          mt-2
          text-sm
          text-neutral-400
        ">

          Spacemonkey core system layer.

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
          kernelSystems.map(

            system => (

              <KernelCard

                key={
                  system.name
                }

                system={
                  system
                }

              />

            )

          )
        }


      </div>


    </section>

  )

}







function KernelCard({
  system,
}){


  return (

    <article className="
      rounded-xl
      border
      border-neutral-800
      bg-black/30
      p-5
    ">


      <div className="
        flex
        items-center
        justify-between
      ">


        <h3 className="
          font-semibold
          text-white
        ">

          {system.name}

        </h3>



        <Status

          value={
            system.status
          }

        />


      </div>







      <p className="
        mt-4
        text-sm
        text-neutral-400
      ">

        {system.description}

      </p>


    </article>

  )

}







function Status({
  value,
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


      {value}


    </span>

  )

}







export default SpacemonkeyKernel
