import PulseCard from "./PulseCard"





function EnvironmentCard({
  pulse,
}) {


  return (

    <PulseCard
      title="Environment"
    >


      <div
        className="
          space-y-3
          text-sm
          text-[var(--wood-muted)]
        "
      >

        <p>
          OS:
          {" "}
          {
            pulse?.environment?.os
            ||
            "-"
          }
        </p>



        <p>
          Kernel:
          {" "}
          {
            pulse?.environment?.kernel
            ||
            "-"
          }
        </p>



        <p>
          Host:
          {" "}
          {
            pulse?.environment?.host
            ||
            "-"
          }
        </p>


      </div>


    </PulseCard>

  )

}



export default EnvironmentCard
