import {
  getSystemRegistry,
} from "../services/system/systemRegistry"



import VersionControl from "../components/settings/VersionControl"

import SystemRegistry from "../components/settings/SystemRegistry"

import SystemActivity from "../components/settings/SystemActivity"

import SpacemonkeyPanel from "../components/settings/SpacemonkeyPanel"





function Settings(){


  const system =
    getSystemRegistry()



  const {
    metadata,
    status,
    summary,
  } =
    system







  const settingsGroups = [


    {
      title:
        "System Registry",

      icon:
        "🖥️",

      items:[

        {
          name:
            "System",

          value:
            metadata.name,

          status:
            status.health.toUpperCase(),

        },


        {
          name:
            "Version",

          value:
            metadata.version,

          status:
            "LOADED",

        },


        {
          name:
            "Environment",

          value:
            metadata.environment,

          status:
            "READY",

        },


        {
          name:
            "System Mode",

          value:
            status.mode,

          status:
            status.healthy
              ? "HEALTHY"
              : "DEGRADED",

        },

      ],

    },



    {
      title:
        "Architecture",

      icon:
        "🏗️",

      items:[

        {
          name:
            "Frontend",

          value:
            metadata.frontend,

          status:
            "READY",

        },


        {
          name:
            "Backend",

          value:
            metadata.backend,

          status:
            "READY",

        },


        {
          name:
            "Database",

          value:
            metadata.database,

          status:
            "READY",

        },


        {
          name:
            "Routes",

          value:
            `${summary.routes} registered`,

          status:
            "LOADED",

        },

      ],

    },


    {
      title:
        "AI System",

      icon:
        "🧠",

      items:[

        {
          name:
            "AI Runtime",

          value:
            metadata.aiRuntime,

          status:
            status.aiRuntime.toUpperCase(),

        },


        {
          name:
            "AI Model",

          value:
            metadata.aiModel,

          status:
            "READY",

        },


        {
          name:
            "Agents",

          value:
            `${summary.activeAgents} / ${summary.agents} active`,

          status:
            "ACTIVE",

        },


        {
          name:
            "Truth Sources",

          value:
            `${summary.truthSources} registered`,

          status:
            "LOADED",

        },

      ],

    },


  ]







  return (

    <div className="
      space-y-8
    ">


      <header>


        <p className="
          text-sm
          font-semibold
          uppercase
          tracking-[0.25em]
          text-amber-500
        ">

          System Control

        </p>



        <h1 className="
          mt-2
          text-4xl
          font-bold
        ">

          ⚙ Settings

        </h1>



        <p className="
          mt-3
          text-neutral-400
        ">

          Wood-Booster AI OS:n järjestelmäkontrolli,
          palautuspisteet ja aktiiviset moduulit.

        </p>


      </header>







      <section className="
        rounded-2xl
        border
        border-green-900
        bg-neutral-900
        p-6
      ">


        <h2 className="
          text-2xl
          font-bold
        ">

          🟢 System Online

        </h2>


        <p className="
          mt-2
          text-neutral-400
        ">

          Wood-Booster AI OS toimii.

        </p>


      </section>







      <SystemRegistry />





      <SystemActivity />





      <VersionControl />





      <SpacemonkeyPanel />







      {
        settingsGroups.map(

          group => (

            <SettingsGroup

              key={group.title}

              group={group}

            />

          )

        )
      }



    </div>

  )

}







function SettingsGroup({
  group,
}) {


  return (

    <section>


      <div className="
        mb-4
        flex
        items-center
        gap-3
      ">

        <span className="text-3xl">

          {group.icon}

        </span>


        <h2 className="text-2xl font-bold">

          {group.title}

        </h2>


      </div>





      <div className="
        grid
        grid-cols-1
        gap-4
        md:grid-cols-2
      ">


        {
          group.items.map(

            item => (

              <article

                key={item.name}

                className="
                  rounded-2xl
                  border
                  border-neutral-800
                  bg-neutral-900
                  p-5
                "

              >

                <h3 className="font-bold">

                  {item.name}

                </h3>


                <p className="
                  mt-2
                  text-green-400
                ">

                  🟢 {item.status}

                </p>


                <p className="
                  mt-3
                  text-neutral-400
                ">

                  {item.value}

                </p>


              </article>

            )

          )

        }


      </div>


    </section>

  )

}







export default Settings
