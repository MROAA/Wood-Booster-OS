import PulseCard from "./PulseCard"

import StatusGlow from "./StatusGlow"





function RuntimeCard({
  pulse,
}) {


  const runtime =
    pulse?.runtime





  return (

    <PulseCard
      title="Runtime"
    >


      <div
        className="
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


    </PulseCard>

  )

}



export default RuntimeCard
