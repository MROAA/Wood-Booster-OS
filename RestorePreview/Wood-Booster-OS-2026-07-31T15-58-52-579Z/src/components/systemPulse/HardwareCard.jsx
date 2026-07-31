import StatusGlow from "./StatusGlow"





function HardwareCard({
  pulse,
}) {


  const hardware =
    pulse?.hardware



  const memoryUsage =
    hardware?.memory?.usedPercent
    ||
    0



  const memoryStatus =
    memoryUsage < 75
      ?
      "healthy"
      :
      memoryUsage < 90
        ?
        "warning"
        :
        "error"





  const gpuCount =
    hardware?.gpu?.count
    ||
    0



  return (

    <section
      className="
        card
        p-6
        wood-hover
      "
    >

      <h2>
        Hardware
      </h2>



      <div
        className="
          mt-5
          space-y-3
        "
      >


        <StatusGlow
          label="CPU"
          value={
            hardware?.cpu?.model
            ||
            "-"
          }
          status="healthy"
        />



        <StatusGlow
          label="GPU"
          value={`
            ${gpuCount}
            detected
          `}
          status={
            gpuCount > 0
              ?
              "healthy"
              :
              "error"
          }
        />



        <StatusGlow
          label="Memory"
          value={`
            ${memoryUsage}%
          `}
          status={memoryStatus}
        />


      </div>


    </section>

  )

}



export default HardwareCard
