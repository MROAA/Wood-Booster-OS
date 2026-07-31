import ChatPanel from "../components/ai/ChatPanel"


function AIWorkspace() {


  return (

    <main
      className="
        min-h-screen
        bg-[var(--wb-background)]
        p-6
      "
    >

      <div
        className="
          h-full
          max-w-5xl
          mx-auto
        "
      >

        <ChatPanel />

      </div>

    </main>

  )

}


export default AIWorkspace
