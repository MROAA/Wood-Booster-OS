import PulseCard from "./PulseCard"





function IdentityCard({
  core,
}) {


  return (

    <PulseCard
      title="Spacemonkey Identity"
    >


      <div
        className="
          space-y-3
          text-sm
          text-[var(--wood-muted)]
        "
      >

        <p>
          Name:
          {" "}
          {
            core?.identity?.name
            ||
            "Checking..."
          }
        </p>



        <p>
          Creator:
          {" "}
          {
            core?.identity?.creator
            ||
            "-"
          }
        </p>



        <p>
          Version:
          {" "}
          {
            core?.version
            ||
            "-"
          }
        </p>


      </div>


    </PulseCard>

  )

}



export default IdentityCard
