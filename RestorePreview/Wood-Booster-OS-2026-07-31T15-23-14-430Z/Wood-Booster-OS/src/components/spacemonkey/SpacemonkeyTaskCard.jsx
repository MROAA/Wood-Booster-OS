function SpacemonkeyTaskCard({
  task,
}) {


  const status =
    task?.status || "idle"


  const file =
    task?.file || null


  const message =
    task?.lastMessage ||
    "Ei aktiivista tehtävää"





  function statusText(){

    if(status === "completed"){
      return "Valmis"
    }


    if(status === "blocked"){
      return "Odottaa tarkistusta"
    }


    if(status === "active"){
      return "Käynnissä"
    }


    return "Ei aktiivista tehtävää"

  }






  function cleanFileName(value){

    if(!value){
      return null
    }


    return value
      .split("/")
      .pop()

  }







  function nextStep(){

    if(status === "blocked"){
      return "Tarvitsee tarkistuksen"
    }


    if(status === "completed"){
      return "Valmis"
    }


    return "Jatketaan työskentelyä"

  }








  return (

    <section

      className="
        rounded-2xl
        p-4
      "

      style={{

        background:
          "var(--wood-panel)",


        border:
          "1px solid var(--wood-border)"

      }}

    >



      <h3

        className="
          font-semibold
        "

      >

        🎯 Tehtävä

      </h3>







      <div

        className="
          mt-4
          space-y-3
        "

      >





        <InfoBlock

          title="Tila"

          value={
            statusText()
          }

          accent

        />








        {
          file && (

            <InfoBlock

              title="Kohde"

              value={
                cleanFileName(file)
              }

            />

          )
        }








        <InfoBlock

          title="Seuraava askel"

          value={
            nextStep()
          }

        />








        <InfoBlock

          title="Viimeisin tieto"

          value={
            message
          }

        />





      </div>





    </section>

  )

}









function InfoBlock({

  title,

  value,

  accent = false,

}){


  return (

    <div

      className="
        rounded-xl
        p-3
      "

      style={{

        background:
          "var(--wood-panel-dark)",


        border:
          "1px solid var(--wood-border)"

      }}

    >



      <p

        className="
          text-xs
        "

        style={{

          color:
            "var(--wood-muted)"

        }}

      >

        {title}

      </p>





      <p

        className="
          mt-1
          text-sm
          font-semibold
        "

        style={{

          color:
            accent
            ? "var(--wood-accent)"
            : "var(--wood-text)"

        }}

      >

        {value}

      </p>



    </div>

  )

}





export default SpacemonkeyTaskCard
