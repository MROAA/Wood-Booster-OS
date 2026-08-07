import {
  Outlet,
} from "react-router-dom"

import Sidebar from "../components/layout/Sidebar"



function OSLayout() {


  return (

    <div
      className="
        w-screen
        h-screen
        overflow-hidden
        flex
        bg-[var(--wood-bg)]
        text-[var(--wood-text)]
      "
    >

      <aside
        className="
          w-[260px]
          shrink-0
          h-full
          overflow-y-auto
          border-r
          border-[var(--wood-border)]
          bg-[var(--wood-panel)]
        "
      >

        <Sidebar />

      </aside>



      <main
        className="
          flex-1
          h-full
          overflow-auto
          p-8
        "
      >

        <Outlet />

      </main>


    </div>

  )

}


export default OSLayout
