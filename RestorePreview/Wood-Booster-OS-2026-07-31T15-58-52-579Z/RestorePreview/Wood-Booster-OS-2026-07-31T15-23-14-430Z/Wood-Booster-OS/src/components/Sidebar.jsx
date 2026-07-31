import {
  NavLink,
} from "react-router-dom"





const links = [

  {
    name:"Dashboard",
    path:"/",
  },

  {
    name:"AI Brain",
    path:"/ai-brain",
  },

  {
    name:"Spacemonkey",
    path:"/spacemonkey",
  },

  {
    name:"Projects",
    path:"/projects",
  },

  {
    name:"Asiakkaat",
    path:"/customers",
  },

  {
    name:"Knowledge",
    path:"/knowledge",
  },

  {
    name:"Memory",
    path:"/memory",
  },

  {
    name:"Settings",
    path:"/settings",
  },

]







function Sidebar(){


  return (

    <aside

      className="
        flex
        h-full
        flex-col
        p-6
      "

      style={{

        background:
          "var(--wood-panel)"

      }}

    >






      <header>


        <h1

          className="
            spacemonkey-title
            text-3xl
          "

          style={{

            color:
              "var(--wood-accent)"

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

            color:
              "var(--wood-muted)"

          }}

        >

          AI WORKSTATION

        </p>


      </header>









      <nav

        className="
          mt-10
          space-y-2
        "

      >

        {
          links.map(

            link => (

              <NavLink

                key={
                  link.path
                }


                to={
                  link.path
                }


                end={
                  link.path === "/"
                }



                className={

                  ({
                    isActive
                  }) =>


                  isActive

                  ?

                  `
                  block
                  rounded-xl
                  px-4
                  py-3
                  text-sm
                  font-semibold
                  `
                  
                  :

                  `
                  block
                  rounded-xl
                  px-4
                  py-3
                  text-sm
                  font-medium
                  transition
                  `

                }



                style={

                  ({
                    isActive
                  }) => ({

                    background:
                      isActive
                      ? "var(--wood-border)"
                      : "transparent",


                    color:
                      isActive
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


      </nav>








      <div

        className="
          mt-auto
          rounded-xl
          p-4
        "

        style={{

          background:
            "var(--wood-panel-dark)",


          border:
            "1px solid var(--wood-border)"

        }}

      >

        <p

          className="
            text-xs
            uppercase
            tracking-widest
          "

          style={{

            color:
              "var(--wood-muted)"

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

              background:
                "var(--wood-green)"

            }}

          />



          <span

            className="
              text-sm
              font-medium
            "

            style={{

              color:
                "var(--wood-text)"

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
