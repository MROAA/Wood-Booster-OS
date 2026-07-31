import {
  NavLink,
} from "react-router-dom"





const sections = [

  {
    title:"WORKSPACE",

    links:[

      {
        name:"AI Workspace",
        path:"/",
      },

      {
        name:"Dashboard",
        path:"/dashboard",
      },

      {
        name:"System",
        path:"/system",
      },

    ]

  },


  {
    title:"BUILD",

    links:[

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

    ]

  },


  {
    title:"SYSTEM",

    links:[

      {
        name:"Capabilities",
        path:"/capabilities",
      },

      {
        name:"Execution",
        path:"/execution",
      },

      {
        name:"Tools",
        path:"/tools",
      },

      {
        name:"Spacemonkey",
        path:"/spacemonkey",
      },

      {
        name:"Settings",
        path:"/settings",
      },

    ]

  },

]








function Sidebar(){


  return (

    <aside

      className="
        h-full
        flex
        flex-col
        p-5
      "

      style={{

        background:
          "var(--wood-panel)",


        borderRight:
          "1px solid var(--wood-border)"

      }}

    >





      <header>


        <h1

          className="
            text-2xl
            font-semibold
            spacemonkey-title
          "

          style={{

            color:
              "var(--wood-text)"

          }}

        >

          🪵 Wood-Booster

        </h1>



        <p

          className="
            mt-2
            text-xs
            tracking-[0.3em]
            uppercase
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
          mt-8
          flex-1
          space-y-7
        "

      >


        {
          sections.map(section=>(


            <div

              key={section.title}

            >


              <p

                className="
                  mb-2
                  text-xs
                  uppercase
                  tracking-widest
                "

                style={{

                  color:
                    "var(--wood-muted)"

                }}

              >

                {section.title}

              </p>






              <div

                className="
                  space-y-1
                "

              >


                {
                  section.links.map(link=>(


                    <NavLink

                      key={link.path}

                      to={link.path}

                      end={
                        link.path === "/"
                      }



                      className={({isActive}) => `

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
                          "font-semibold"
                          :
                          ""
                        }

                      `}



                      style={({isActive})=>({


                        background:

                          isActive

                          ?

                          "var(--wood-accent-soft)"

                          :

                          "transparent",




                        color:

                          isActive

                          ?

                          "var(--wood-accent)"

                          :

                          "var(--wood-muted)"


                      })}



                    >


                      {
                        ({isActive}) => (

                          <>

                            <span

                              className="
                                h-1.5
                                w-1.5
                                rounded-full
                              "

                              style={{

                                background:

                                  isActive

                                  ?

                                  "var(--wood-accent)"

                                  :

                                  "transparent"

                              }}

                            />


                            {link.name}


                          </>

                        )
                      }


                    </NavLink>


                  ))

                }


              </div>


            </div>


          ))

        }


      </nav>









      <footer

        className="
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

          SYSTEM STATUS

        </p>



        <p

          className="
            mt-2
            text-sm
            font-semibold
          "

          style={{

            color:
              "var(--wood-green)"

          }}

        >

          ONLINE

        </p>


      </footer>





    </aside>

  )

}





export default Sidebar
