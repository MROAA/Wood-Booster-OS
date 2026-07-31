import Sidebar from "../components/Sidebar"

import ChatPanel from "../components/ai/ChatPanel"

import SpacemonkeyPanel from "../components/ai/SpacemonkeyPanel"





function OSLayout(){


  return (

    <div

      className="
        flex
        h-screen
        w-screen
        overflow-hidden
        bg-[#07110D]
        text-white
      "

    >




      <aside

        className="
          w-[280px]
          shrink-0
          bg-[#1C120B]
          border-r
          border-[#3B2415]
        "

      >

        <Sidebar />

      </aside>







      <main

        className="
          flex-1
          min-w-0
          p-5
          bg-[#07110D]
        "

      >

        <ChatPanel />

      </main>







      <aside

        className="
          w-[460px]
          shrink-0
          overflow-y-auto
          bg-[#1C120B]
          border-l
          border-[#3B2415]
          p-5
        "

      >

        <SpacemonkeyPanel />

      </aside>





    </div>

  )

}





export default OSLayout