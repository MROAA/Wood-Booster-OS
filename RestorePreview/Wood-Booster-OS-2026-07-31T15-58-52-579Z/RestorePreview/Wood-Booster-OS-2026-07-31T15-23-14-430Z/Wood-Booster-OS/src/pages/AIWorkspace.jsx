import ChatPanel from "../components/ai/ChatPanel"

import WorkspaceHeader from "../components/layout/WorkspaceHeader"





function AIWorkspace(){


  return (

    <div

      className="
        h-full
        w-full
        flex
        flex-col
        gap-3
        overflow-hidden
      "

    >

      <WorkspaceHeader />



      <div

        className="
          flex-1
          min-h-0
        "

      >

        <ChatPanel />

      </div>


    </div>

  )

}





export default AIWorkspace
