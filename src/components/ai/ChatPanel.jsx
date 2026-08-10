import {
  useState
} from "react"


import SpacemonkeyIcon from "../branding/SpacemonkeyIcon"

import {
  createRuntimeContext,
} from "../../services/runtime/runtimeContext"



function ChatPanel() {


  const [
    message,
    setMessage
  ] = useState("")



  const [
    isThinking,
    setIsThinking
  ] = useState(false)



  const [
    messages,
    setMessages
  ] = useState([

    {
      role: "assistant",
      content:
        "Terve.\n\nMitäs tänään?"
    }

  ])





  async function sendMessage() {


    if (!message.trim()) {
      return
    }



    const userText = message



    setMessages(
      previous => [

        ...previous,

        {
          role: "user",
          content: userText
        }

      ]
    )



    setMessage("")

    setIsThinking(true)



    try {

      const response =
        await fetch(
          "http://localhost:3001/api/agents/chat",
          {
            method: "POST",

            headers: {
              "Content-Type": "application/json"
            },

            body: JSON.stringify({
              message: userText,
              runtimeContext: createRuntimeContext(),
            })

          }
        )



      const data =
        await response.json()



      setMessages(
        previous => [

          ...previous,

          {
            role: "assistant",
            content:
              data.answer ||
              "Ei vastausta."
          }

        ]
      )


    } catch(error) {


      setMessages(
        previous => [

          ...previous,

          {
            role: "assistant",
            content:
              "Yhteys Spacemonkeyhin epäonnistui."
          }

        ]
      )

    } finally {

      setIsThinking(false)

    }


  }





  return (

    <div
      className="
        relative
        h-full
        min-h-0
        flex
        flex-col
      "
    >

      {/* Hyvin himmeä lämmin hehku taustalla - antaa paneelille syvyyttä
          ilman että se kilpailee viestien kanssa huomiosta. */}
      <div
        className="
          pointer-events-none
          absolute
          inset-0
          -z-10
          opacity-40
        "
        style={{
          background:
            "radial-gradient(circle at 15% 0%, rgba(107,127,74,0.10), transparent 55%)",
        }}
        aria-hidden="true"
      />

      <div
        className="
          wood-scroll
          flex-1
          min-h-0
          overflow-y-auto
          p-5
          space-y-4
        "
      >

        {
          messages.map(
            (item,index) => (

              <div
                key={index}
                className="
                  message-appear
                  flex
                  gap-3
                  items-start
                "
              >


                {
                  item.role === "assistant" && (

                    <div
                      className="
                        soft-glow
                        shrink-0
                        rounded-lg
                      "
                    >

                      <SpacemonkeyIcon />

                    </div>

                  )
                }



                <div
                  className={`
                    max-w-[65%]
                    px-4
                    py-3
                    text-sm
                    leading-relaxed
                    whitespace-pre-line
                    shadow-sm

                    ${
                      item.role === "user"

                      ?

                      "ml-auto rounded-2xl rounded-br-md bg-[var(--wood-accent)] text-[#17120c]"

                      :

                      "rounded-2xl rounded-bl-md border border-[var(--wood-border)] bg-gradient-to-br from-[var(--wood-panel)] to-[var(--wood-card)] text-[var(--wood-text)]"

                    }

                  `}
                >

                  {item.content}

                </div>


              </div>

            )
          )
        }


        {
          isThinking && (

            <div
              className="
                message-appear
                flex
                gap-3
                items-start
              "
            >

              <div
                className="
                  soft-glow
                  shrink-0
                  rounded-lg
                "
              >

                <SpacemonkeyIcon />

              </div>



              <div
                className="
                  flex
                  items-center
                  gap-1.5
                  rounded-2xl
                  rounded-bl-md
                  px-4
                  py-3.5
                  border
                  border-[var(--wood-border)]
                  bg-[var(--wood-panel)]
                "
              >

                <span
                  className="
                    h-1.5
                    w-1.5
                    rounded-full
                    bg-[var(--wood-accent)]
                    animate-bounce
                  "
                  style={{ animationDelay: "0ms" }}
                />

                <span
                  className="
                    h-1.5
                    w-1.5
                    rounded-full
                    bg-[var(--wood-accent)]
                    animate-bounce
                  "
                  style={{ animationDelay: "120ms" }}
                />

                <span
                  className="
                    h-1.5
                    w-1.5
                    rounded-full
                    bg-[var(--wood-accent)]
                    animate-bounce
                  "
                  style={{ animationDelay: "240ms" }}
                />

              </div>


            </div>

          )
        }


      </div>





      <div
        className="
          shrink-0
          p-4
          border-t
          border-[var(--wood-border)]
          bg-[var(--wood-panel)]
        "
      >

        <div
          className="
            flex
            gap-3
          "
        >

          <input

            value={message}

            onChange={
              event =>
                setMessage(
                  event.target.value
                )
            }


            onKeyDown={
              event => {

                if (
                  event.key === "Enter"
                ) {

                  sendMessage()

                }

              }
            }


            placeholder="Kirjoita viesti Spacemonkeylle..."


            className="
              flex-1
              h-12
              rounded-full
              px-5
              bg-[var(--wood-bg)]
              border
              border-[var(--wood-border)]
              text-sm
              text-[var(--wood-text)]
              placeholder:text-[var(--wood-muted)]
              outline-none
              transition-shadow
              duration-200
              focus:border-[var(--wood-accent)]
              focus:shadow-[0_0_0_3px_rgba(107,127,74,0.15)]
            "

          />



          <button

            onClick={sendMessage}

            className="
              h-12
              px-8
              rounded-full
              bg-[var(--wood-accent)]
              text-[#17120c]
              font-medium
              transition-all
              duration-200
              ease-out
              hover:scale-[1.03]
              hover:opacity-90
              active:scale-95
            "

          >

            Lähetä  ➤

          </button>


        </div>


      </div>


    </div>

  )

}


export default ChatPanel
