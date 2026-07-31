import {
  Outlet,
} from "react-router-dom"


import Sidebar from "../components/layout/Sidebar"

import SpacemonkeyPanel from "../components/ai/SpacemonkeyPanel"





function OSLayout(){


  return (

    <div

      className="
        flex
        h-screen
        w-screen
        overflow-hidden
      "

      style={{

        background:
          "var(--wood-background)"

      }}

    >



      <aside

        className="
          h-full
          shrink-0
        "

        style={{

          width:
            "280px"

        }}

      >

        <Sidebar />

      </aside>





      <main

        className="
          flex-1
          min-w-0
          h-full
          overflow-hidden
          p-4
        "

      >

        <Outlet />

      </main>





      <aside

        className="
          h-full
          shrink-0
          p-4
        "

        style={{

          width:
            "340px"

        }}

      >

        <SpacemonkeyPanel />

      </aside>



    </div>

  )

}


export default OSLayout
