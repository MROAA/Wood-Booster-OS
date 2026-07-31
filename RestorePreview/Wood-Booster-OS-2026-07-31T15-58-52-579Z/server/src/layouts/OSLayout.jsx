import {
  Outlet,
} from "react-router-dom"


import {
  useState,
} from "react"


import Sidebar from "../components/Sidebar"


import ChatPanel from "../components/ai/ChatPanel"





function OSLayout(){


  const [
    conversationId,
    setConversationId,
  ] = useState(null)





  return (

    <div
      className="
        h-screen
        w-screen
        overflow-hidden
        flex
        bg-neutral-950
        text-white
      "
    >



      <aside
        className="
          w-72
          shrink-0
          border-r
          border-neutral-800
        "
      >

        <Sidebar />

      </aside>





      <main
        className="
          flex-1
          flex
          overflow-hidden
        "
      >


        <section
          className="
            flex-1
            overflow-y-auto
            p-6
          "
        >

          <Outlet />

        </section>





        <aside
          className="
            w-[420px]
            shrink-0
            border-l
            border-neutral-800
            bg-neutral-900
          "
        >


          <ChatPanel

            conversationId={
              conversationId
            }

            setConversationId={
              setConversationId
            }

          />


        </aside>


      </main>


    </div>

  )

}


export default OSLayout
