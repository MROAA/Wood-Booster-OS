import {
  NavLink
} from "react-router-dom"



const groups = [

  {
    title: "TYÖTILA",

    items: [

      {
        label: "Dashboard",
        path: "/",
        icon: "⌂"
      }

    ]

  },


  {
    title: "TUOTANTO",

    items: [

      {
        label: "Projektit",
        path: "/projects",
        icon: "▣"
      },


      {
        label: "Asiakkaat",
        path: "/customers",
        icon: "◎"
      },


      {
        label: "Materiaalit",
        path: "/inventory",
        icon: "◇"
      },


      {
        label: "Ostot",
        path: "/purchases",
        icon: "▦"
      },


      {
        label: "Laskut",
        path: "/invoices",
        icon: "🧾"
      }

    ]

  },


  {
    title: "ÄLY",

    items: [

      {
        label: "Knowledge",
        path: "/knowledge",
        icon: "◌"
      },


      {
        label: "Memory",
        path: "/memory",
        icon: "◈"
      },


      {
        label: "Agents",
        path: "/agents",
        icon: "△"
      },


      {
        label: "System Pulse",
        path: "/system-pulse",
        icon: "◉"
      },


      {
        label: "Spacemonkey Brain",
        path: "/spacemonkey-brain",
        icon: "🐒"
      }

    ]

  },


  {
    title: "JÄRJESTELMÄ",

    items: [

      {
        label: "Settings",
        path: "/settings",
        icon: "⚙"
      }

    ]

  }

]





function Sidebar() {


  return (

    <aside
      className="
        h-screen
        w-full
        bg-[var(--wood-panel)]
        px-6
        py-8
        flex
        flex-col
      "
    >


      <header>

        <h1
          className="
            text-3xl
            brand-font
            text-[var(--wood-text)]
          "
        >
          Wood-Booster
        </h1>


        <p
          className="
            mt-2
            text-sm
            uppercase
            tracking-widest
            text-[var(--wood-muted)]
          "
        >
          OS Workspace
        </p>


      </header>





      <nav
        className="
          mt-10
          flex-1
          space-y-8
        "
      >

        {
          groups.map(
            group => (

              <section
                key={group.title}
              >

                <p
                  className="
                    mb-3
                    text-xs
                    uppercase
                    tracking-widest
                    text-[var(--wood-muted)]
                  "
                >
                  {group.title}
                </p>



                <div
                  className="
                    space-y-2
                  "
                >

                  {
                    group.items.map(
                      item => (

                        <NavLink
                          key={item.path}
                          to={item.path}

                          className={
                            ({isActive}) => `

                              flex
                              items-center
                              gap-4

                              rounded-xl

                              px-5
                              py-4

                              text-base

                              transition

                              ${
                                isActive

                                ?

                                "bg-[var(--wood-card)] text-[var(--wood-accent)]"

                                :

                                "text-[var(--wood-muted)] hover:bg-[var(--wood-card)] hover:text-[var(--wood-text)]"

                              }

                            `
                          }

                        >

                          <span
                            className="
                              text-xl
                            "
                          >
                            {item.icon}
                          </span>


                          <span>
                            {item.label}
                          </span>


                        </NavLink>

                      )
                    )
                  }


                </div>


              </section>

            )
          )
        }


      </nav>





      <footer>

        <div
          className="
            rounded-xl
            border
            border-[var(--wood-border)]
            bg-[var(--wood-card)]
            p-5
          "
        >

          <p
            className="
              text-xs
              uppercase
              tracking-widest
              text-[var(--wood-muted)]
            "
          >
            PUUN EHDOILLA
          </p>


          <p
            className="
              mt-2
              text-base
              text-[var(--wood-text)]
            "
          >
            Wood-Booster OS
          </p>


        </div>


      </footer>


    </aside>

  )

}


export default Sidebar
