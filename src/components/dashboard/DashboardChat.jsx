import ChatPanel from "../ai/ChatPanel"



function DashboardChat() {


  return (

    <section
      className="
        card
        h-full
        min-h-0
        flex
        flex-col
        overflow-hidden
      "
    >


      <div
        className="
          shrink-0
          px-5
          py-3
          border-b
          border-[var(--wood-border)]
        "
      >

        <h2
          className="
            text-xs
            uppercase
            tracking-widest
            text-[var(--wood-muted)]
          "
        >
          Spacemonkey Chat
        </h2>


      </div>





      <div
        className="
          flex-1
          min-h-0
          overflow-hidden
        "
      >

        <ChatPanel />

      </div>


    </section>

  )

}


export default DashboardChat
