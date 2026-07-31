import StatusGlow from "./StatusGlow"





function RuntimeCard({
  pulse,
}) {


  const runtime =
    pulse?.runtime



  return (

    <section
      className="
        card
        p-6
        wood-hover
      "
    >

      <h2>
        Runtime
      </h2>



      <div
        className="
          mt-5
          space-y-3
        "
      >

        <StatusGlow
          label="Node"
          value={
            runtime?.nodeVersion
            ||
            "-"
          }
          status="healthy"
        />



        <StatusGlow
          label="CPU"
          value={`
            ${
              runtime?.cpuCount
              ||
              0
            }
            cores
          `}
          status="healthy"
        />


      </div>


    </section>

  )

}



export default RuntimeCard
