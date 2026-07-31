import {
  NavLink,
} from "react-router-dom"

const groups = [

  {
    title: "WORKSPACE",
    links: [
      { name: "AI Workspace", path: "/" },
      { name: "Dashboard", path: "/dashboard" },
      { name: "System", path: "/system" },
    ],
  },

  {
    title: "BUILD",
    links: [
      { name: "Projects", path: "/projects" },
      { name: "Asiakkaat", path: "/customers" },
      { name: "Knowledge", path: "/knowledge" },
      { name: "Memory", path: "/memory" },
    ],
  },

  {
    title: "SYSTEM",
    links: [
      { name: "Capabilities", path: "/capabilities" },
      { name: "Execution", path: "/execution" },
      { name: "Tools", path: "/tools" },
      { name: "Spacemonkey", path: "/spacemonkey" },
      { name: "Settings", path: "/settings" },
    ],
  },

]

function Sidebar() {

  return (

    <aside
      className="
        flex
        h-full
        w-64
        flex-col
        p-6
        overflow-y-auto
      "
      style={{
        background: "var(--wood-panel)",
      }}
    >

      <header>

        <h1
          className="
            spacemonkey-title
            text-3xl
            leading-tight
          "
          style={{
            color: "var(--wood-accent)",
          }}
        >
          Wood-Booster
        </h1>

        <p
          className="
            mt-3
            text-xs
            uppercase
            tracking-[0.35em]
          "
          style={{
            color: "var(--wood-muted)",
          }}
        >
          AI WORKSTATION
        </p>

      </header>

      <nav
        className="
          mt-10
          flex-1
          space-y-6
        "
      >

        {
          groups.map(
            group => (

              <div key={group.title}>

                <p
                  className="
                    px-4
                    mb-2
                    text-[11px]
                    font-semibold
                    uppercase
                    tracking-widest
                  "
                  style={{
                    color: "var(--wood-muted)",
                  }}
                >
                  {group.title}
                </p>

                <div className="space-y-1">

                  {
                    group.links.map(
                      link => (

                        <NavLink
                          key={link.path}
                          to={link.path}
                          end={link.path === "/"}
                          className="
                            block
                            rounded-xl
                            px-4
                            py-3
                            text-sm
                            font-medium
                            transition
                          "
                          style={
                            ({ isActive }) => ({
                              background: isActive
                                ? "var(--wood-border)"
                                : "transparent",
                              color: isActive
                                ? "var(--wood-accent)"
                                : "var(--wood-muted)",
                            })
                          }
                        >
                          {link.name}
                        </NavLink>

                      )
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
          mt-6
          rounded-xl
          p-4
        "
        style={{
          background: "var(--wood-panel-dark)",
          border: "1px solid var(--wood-border)",
        }}
      >

        <p
          className="
            text-xs
            uppercase
            tracking-widest
          "
          style={{
            color: "var(--wood-muted)",
          }}
        >
          System Status
        </p>

        <div
          className="
            mt-3
            flex
            items-center
            gap-3
          "
        >

          <span
            className="
              h-2
              w-2
              rounded-full
            "
            style={{
              background: "var(--wood-green)",
            }}
          />

          <span
            className="
              text-sm
              font-medium
            "
            style={{
              color: "var(--wood-text)",
            }}
          >
            Online
          </span>

        </div>

      </div>

    </aside>

  )

}

export default Sidebar
