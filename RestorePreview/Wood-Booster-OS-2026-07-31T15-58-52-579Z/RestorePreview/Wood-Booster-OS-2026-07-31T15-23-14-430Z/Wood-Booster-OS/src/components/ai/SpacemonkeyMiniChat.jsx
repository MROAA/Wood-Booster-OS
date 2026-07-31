import {
  useState,
} from "react"



const jokes = [

  "Miksi puu ei käytä salasanaa? Koska sillä on jo ROOT-oikeudet. 🌲",

  "Spacemonkey löysi bugin. Se ei ollut bugi, vaan ominaisuus joka eksyi metsään. 🐒",

  "Miksi tekoäly meni metsään? Se etsi parempaa branchia. 🌳",

  "Jos koodi ei toimi, tarkista ensin kahvi. Sitten koodi. ☕",

  "Puu kasvaa hitaasti. Hyvä ohjelmisto tekee samoin. Kiireellä tulee vain lastulevyä. 😄",

  "Minulla ei ole tunteita, mutta hyvä commit-viesti lämmittää prosessoriani. 💾",

]





function SpacemonkeyMiniChat(){


  const [
    message,
    setMessage,
  ] = useState("")



  const [
    reply,
    setReply,
  ] = useState(
    "🐒 Terve. Olen Spacemonkey. Pyydä minulta vaikka vitsi."
  )





  function handleSend(){


    const text =
      message
        .toLowerCase()
        .trim()



    if(!text){

      return

    }



    if(
      text.includes("vitsi") ||
      text.includes("hauska") ||
      text.includes("naura")
    ){


      const random =

        jokes[
          Math.floor(
            Math.random()
            *
            jokes.length
          )
        ]



      setReply(
        random
      )


    }
    else{


      setReply(
        "🐒 Pieni Spacemonkey-moduuli kuuntelee. Isompi AI Brain yhdistetään myöhemmin."
      )


    }



    setMessage("")


  }





  return (

    <div

      className="
        mt-4
        rounded-xl
        border
        border-neutral-800
        bg-neutral-900
        p-3
        space-y-3
      "

    >


      <div

        className="
          text-xs
          text-neutral-400
        "

      >

        💬 Spacemonkey Mini Chat

      </div>





      <div

        className="
          rounded-lg
          bg-neutral-950
          p-3
          text-sm
          text-white
          min-h-20
        "

      >

        {reply}

      </div>





      <div

        className="
          flex
          gap-2
        "

      >


        <input

          value={
            message
          }


          onChange={
            event =>
              setMessage(
                event.target.value
              )
          }


          onKeyDown={
            event => {

              if(
                event.key === "Enter"
              ){

                handleSend()

              }

            }
          }


          placeholder="Kysy tai pyydä vitsi..."


          className="
            flex-1
            rounded-lg
            border
            border-neutral-700
            bg-neutral-950
            px-3
            py-2
            text-sm
            text-white
          "

        />




        <button

          onClick={
            handleSend
          }


          className="
            rounded-lg
            bg-neutral-800
            px-3
            hover:bg-neutral-700
          "

        >

          🚀

        </button>


      </div>


    </div>

  )

}





export default SpacemonkeyMiniChat
