import {
  useLocation
} from "react-router-dom"

import logo from "../../assets/branding/wood-booster-logo.png"



function DashboardSidebar() {


  const location = useLocation()



  const sections = [

    {
      title: "WORKSPACE",
      items: [
        {
          icon: "⌂",
          label: "Dashboard",
          path: "/"
        }
      ]
    },

    {
      title: "TUOTANTO",
      items: [
        {
          icon: "▣",
          label: "Projektit",
          path: "/projects"
        },
        {
          icon: "◎",
          label: "Asiakkaat",
          path: "/customers"
        },
        {
          icon: "◇",
          label: "Materiaalit",
          path: "/inventory"
        }
      ]
    },

    {
      title: "ÄLY",
      items: [
        {
          icon: "◌",
          label: "Knowledge",
          path: "/knowledge"
        },
        {
          icon: "◈",
          label: "Memory",
          path: "/memory"
        },
        {
          icon: "△",
          label: "Agents",
          path: "/agents"
        },
        {
          icon: "◉",
          label: "System Pulse",
          path: "/system-pulse"
        },
        {
          icon: "🐒",
          label: "Spacemonkey",
          path: "/spacemonkey-brain"
        }
      ]
    },

    {
      title: "JÄRJESTELMÄ",
      items: [
        {
          icon: "⚙",
          label: "Settings",
          path: "/settings"
        }
      ]
    }

  ]





  return (

    <div
      className="
        h-full
        flex
        flex-col
        overflow-hidden
      "
    >


      <div
        className="
          shrink-0
        "
      >

        <img
          src={logo}
          alt="Wood-Booster"
          className="
            w-28
            h-28
            object-contain
            mb-5
          "
        />


        <h1
          className="
            brand-font
            text-3xl
            text-white
          "
        >
          Wood-Booster OS
        </h1>


        <p
          className="
            mt-4
            text-base
            uppercase
            tracking-widest
            text-[var(--wood-muted)]
          "
        >
          Workspace
        </p>


      </div>





      <nav
        className="
          mt-10
          flex-1
          overflow-y-auto
          space-y-10
          pr-3
          scrollbar-hide
        "
      >

        {
          sections.map(
            section => (

              <div
                key={section.title}
              >

                <p
                  className="
                    mb-4
                    text-sm
                    uppercase
                    tracking-[0.3em]
                    text-[var(--wood-muted)]
                  "
                >
                  {section.title}
                </p>


                <div
                  className="
                    space-y-3
                  "
                >

                  {
                    section.items.map(
                      item => {

                        const active =
                          location.pathname === item.path


                        return (

                          <div
                            key={item.label}
                            className={`
                              relative
                              flex
                              items-center
                              gap-5
                              rounded-xl
                              px-5
                              py-4
                              text-lg
                              cursor-pointer
                              transition

                              ${
                                active
                                  ?
                                  "bg-[var(--wood-panel)] text-white"
                                  :
                                  "text-[var(--wood-text)] hover:bg-[var(--wood-panel)]"
                              }
                            `}
                          >


                            {
                              active && (

                                <span
                                  className="
                                    absolute
                                    left-0
                                    top-4
                                    bottom-4
                                    w-1
                                    rounded-full
                                    bg-[var(--wood-accent)]
                                  "
                                />

                              )
                            }


                            <span
                              className="
                                w-8
                                text-center
                                text-2xl
                                text-[var(--wood-accent)]
                              "
                            >
                              {item.icon}
                            </span>


                            <span>
                              {item.label}
                            </span>


                          </div>

                        )

                      }
                    )
                  }


                </div>


              </div>

            )
          )
        }


      </nav>





      <div
        className="
          shrink-0
          pt-8
          border-t
          border-[var(--wood-border)]
        "
      >

        <p
          className="
            text-base
            uppercase
            tracking-widest
            text-[var(--wood-muted)]
          "
        >
          PUUN EHDOILLA
        </p>


        <p
          className="
            mt-4
            text-lg
            text-green-400
          "
        >
          ● Online
        </p>


      </div>


    </div>

  )

}


export default DashboardSidebar
