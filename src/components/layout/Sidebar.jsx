import {
  NavLink,
  Link
} from "react-router-dom"

import logo from "../../assets/branding/wood-booster-logo.png"



const groups = [

  {
    title: "TYÖTILA",

    items: [

      {
        label: "Dashboard",
        path: "/",
        icon: "⌂"
      },

      {
        label: "Työpöytä näkymä",
        path: "/desktop",
        icon: "🖥"
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
        label: "Tarjoukset",
        path: "/quotes",
        icon: "▧"
      },


      {
        label: "Laskut",
        path: "/invoices",
        icon: "▥"
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
        label: "Tiedostojen lataus",
        path: "/knowledge/upload",
        icon: "📥"
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
        icon: "⬡"
      }

    ]

  },


  {
    title: "AI TYÖTILA",

    items: [

      {
        label: "Tools",
        path: "/tools",
        icon: "▨"
      },


      {
        label: "Dev Studio",
        path: "/dev-studio",
        icon: "λ"
      },

      {
        label: "Projektityötila",
        path: "/project-workspace",
        icon: "🗂"
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

  },


  {
    title: "TAUKO",

    items: [

      {
        label: "Spider-pasianssi",
        path: "/spider-solitaire",
        icon: "♤"
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
        px-5
        py-5
        flex
        flex-col
        overflow-y-auto
      "
    >


      <Link
        to="/"
        className="
          flex
          items-center
          gap-2.5
        "
      >

        <img
          src={logo}
          alt="Wood-Booster"
          className="
            h-8
            w-8
            shrink-0
            object-contain
          "
        />

        <h1
          className="
            text-xl
            leading-tight
            brand-font
            text-[var(--wood-text)]
          "
        >
          Wood-Booster HQ
        </h1>


      </Link>


<Link
        to="/spacemonkey-chat"
        className="
          mt-4
          flex
          items-center
          gap-2
          rounded-lg
          bg-[var(--wood-accent)]
          text-white
          px-3
          py-2
          text-sm
          font-medium
          hover:opacity-90
          transition
        "
      >
        🐵 Spacemonkey Chat
      </Link>


      <nav
        className="
          mt-6
          flex-1
          space-y-3.5
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
                    mb-1.5
                    text-[10px]
                    uppercase
                    tracking-widest
                    text-[var(--wood-muted)]
                  "
                >
                  {group.title}
                </p>



                <div
                  className="
                    space-y-0.5
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
                              gap-3

                              rounded-lg

                              px-3
                              py-2

                              text-sm

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
                              text-base
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





      <footer
        className="
          mt-4
          shrink-0
        "
      >

        <div
          className="
            rounded-lg
            border
            border-[var(--wood-border)]
            bg-[var(--wood-card)]
            px-4
            py-3
          "
        >

          <p
            className="
              text-[10px]
              uppercase
              tracking-widest
              text-[var(--wood-muted)]
            "
          >
            PUUN EHDOILLA
          </p>


          <p
            className="
              mt-1
              text-sm
              text-[var(--wood-text)]
            "
          >
            Wood-Booster HQ
          </p>


        </div>


      </footer>


    </aside>

  )

}


export default Sidebar
