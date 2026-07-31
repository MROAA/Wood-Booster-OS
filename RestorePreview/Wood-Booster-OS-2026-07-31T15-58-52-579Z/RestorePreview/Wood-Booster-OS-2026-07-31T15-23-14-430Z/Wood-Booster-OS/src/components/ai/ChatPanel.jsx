import {
  useState,
  useEffect,
} from "react"


import {
  useChat,
} from "../../context/ChatContext"





const API_URL =
  "http://localhost:3001/api"







function ChatPanel(){


  const {
    conversationId,
    setConversationId,

  } = useChat()





  const [
    message,
    setMessage,

  ] = useState("")





  const [
    messages,
    setMessages,

  ] = useState([])





  const [
    loading,
    setLoading,

  ] = useState(false)









  useEffect(()=>{


    if(!conversationId){

      setMessages([])

    }


  },[conversationId])









  async function sendMessage(){


    if(
      !message.trim() ||
      loading
    ){

      return

    }





    const userMessage =
      message.trim()





    setMessages(

      current => [

        ...current,

        {
          role:"user",
          content:userMessage,
        }

      ]

    )





    setMessage("")

    setLoading(true)





    try{


      const response =
        await fetch(

          `${API_URL}/ai-brain/chat`,

          {

            method:"POST",

            headers:{

              "Content-Type":
                "application/json"

            },


            body:JSON.stringify({

              message:userMessage,

              conversationId,

            })

          }

        )





      const data =
        await response.json()





      if(data.conversationId){

        setConversationId(
          data.conversationId
        )

      }





      setMessages(

        current => [

          ...current,


          {

            role:"assistant",

            content:

              data.answer ||

              "Ei vastausta"

          }

        ]

      )


    }


    catch(error){


      setMessages(

        current => [

          ...current,


          {

            role:"assistant",

            content:
              "Yhteys Spacemonkeyhin epäonnistui."

          }

        ]

      )


    }



    finally{

      setLoading(false)

    }



  }









  return (

    <section

      className="
        flex
        h-full
        w-full
        flex-col
        overflow-hidden
        rounded-2xl
      "

      style={{

        background:
          "var(--wood-panel)",


        border:
          "1px solid var(--wood-border)"

      }}

    >







      <div

        className="
          flex-1
          min-h-0
          overflow-y-auto
          p-6
        "

      >





        <div

          className="
            mx-auto
            flex
            h-full
            max-w-4xl
            flex-col
            justify-center
            gap-4
          "

        >





        {
          messages.length === 0 && (

            <p

              className="
                text-center
                text-sm
              "

              style={{

                color:
                  "var(--wood-muted)"

              }}

            >

              Aloita keskustelu Spacemonkeyn kanssa.

            </p>

          )

        }






        {
          messages.map(

            (item,index)=>(


              <div

                key={index}

                className="
                  rounded-xl
                  px-5
                  py-4
                  text-sm
                "

                style={{

                  alignSelf:

                    item.role === "user"

                    ?

                    "flex-end"

                    :

                    "flex-start",



                  maxWidth:
                    "80%",



                  background:

                    item.role === "user"

                    ?

                    "var(--wood-accent)"

                    :

                    "var(--wood-panel-dark)",



                  color:

                    item.role === "user"

                    ?

                    "#101010"

                    :

                    "var(--wood-text)",



                  border:

                    "1px solid var(--wood-border-soft)"

                }}

              >

                {item.content}

              </div>


            )

          )

        }






        {
          loading && (

            <div

              className="
                rounded-xl
                px-5
                py-3
                text-sm
              "

              style={{

                background:
                  "var(--wood-panel-dark)",


                color:
                  "var(--wood-muted)"

              }}

            >

              Spacemonkey käsittelee...

            </div>

          )

        }


        </div>


      </div>









      <footer

        className="
          p-5
        "

      >


        <textarea

          value={message}


          onChange={

            e =>
              setMessage(
                e.target.value
              )

          }



          onKeyDown={

            e => {


              if(
                e.key === "Enter" &&
                !e.shiftKey
              ){

                e.preventDefault()

                sendMessage()

              }


            }

          }




          rows="1"


          placeholder="Kirjoita Spacemonkeylle..."



          className="
            mx-auto
            block
            w-full
            max-w-4xl
            resize-none
            rounded-xl
            px-5
            py-4
            outline-none
          "



          style={{

            background:
              "var(--wood-background)",


            color:
              "var(--wood-text)",


            border:
              "1px solid var(--wood-border)"

          }}


        />


      </footer>





    </section>

  )

}





export default ChatPanel
