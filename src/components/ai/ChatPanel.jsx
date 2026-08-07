import {
  useState
} from "react"


import SpacemonkeyIcon from "../branding/SpacemonkeyIcon"



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
              message: userText
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
        h-full
        min-h-0
        flex
        flex-col
      "
    >


      <div
        className="
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
                  flex
                  gap-3
                  items-start
                "
              >


                {
                  item.role === "assistant" && (

                    <div
                      className="
                        shrink-0
                      "
                    >

                      <SpacemonkeyIcon />

                    </div>

                  )
                }



                <div
                  className={`
                    max-w-[65%]
                    rounded-xl
                    px-4
                    py-3
                    text-sm
                    leading-relaxed
                    whitespace-pre-line

                    ${
                      item.role === "user"

                      ?

                      "ml-auto bg-[var(--wood-accent)] text-black"

                      :

                      "border border-[var(--wood-border)] bg-[var(--wood-panel)] text-[var(--wood-text)]"

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
                flex
                gap-3
                items-start
              "
            >

              <div
                className="
                  shrink-0
                "
              >

                <SpacemonkeyIcon />

              </div>



              <div
                className="
                  max-w-[65%]
                  rounded-xl
                  px-4
                  py-3
                  text-sm
                  leading-relaxed
                  animate-pulse
                  border
                  border-[var(--wood-border)]
                  bg-[var(--wood-panel)]
                  text-[var(--wood-muted)]
                "
              >

                Spacemonkey miettii...

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
              rounded-xl
              px-5
              bg-[var(--wood-bg)]
              border
              border-[var(--wood-border)]
              text-sm
              text-[var(--wood-text)]
              placeholder:text-[var(--wood-muted)]
              outline-none
            "

          />



          <button

            onClick={sendMessage}

            className="
              h-12
              px-8
              rounded-xl
              bg-[var(--wood-accent)]
              text-black
              font-medium
              transition-all
              duration-200
              ease-out
              hover:scale-[1.03]
              hover:opacity-90
              active:scale-95
            "

          >

            Lähetä

          </button>


        </div>


      </div>


    </div>

  )

}


export default ChatPanel
