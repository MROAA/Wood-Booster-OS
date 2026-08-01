import PulseCard from "./PulseCard"





function SecurityCard({
  security,
}) {


  const status =
    security?.status
    ||
    "unknown"



  const warning =
    status === "warning"




  return (

    <PulseCard
      title="Security"
    >


      <div
        className="
          space-y-3
          text-sm
          text-[var(--wood-muted)]
        "
      >

        <div>
          Status:

          {" "}

          <span
            className={
              warning
                ?
                "text-yellow-400"
                :
                "text-green-400"
            }
          >
            {status}
          </span>

        </div>



        <div>
          Approved:

          {" "}

          <span
            className="text-[var(--wood-text)]"
          >
            {
              security?.capabilitiesApproved
              ||
              0
            }
          </span>

        </div>



        <div>
          Blocked:

          {" "}

          <span
            className="text-[var(--wood-text)]"
          >
            {
              security?.blocked
              ||
              0
            }
          </span>

        </div>



        <div>
          Approval required:

          {" "}

          <span
            className="text-[var(--wood-text)]"
          >
            {
              security?.approvalRequired
              ||
              0
            }
          </span>

        </div>



        {
          security?.message &&
          (

            <div
              className="
                pt-3
                text-xs
                text-[var(--wood-muted)]
              "
            >
              {security.message}

            </div>

          )
        }


      </div>


    </PulseCard>

  )

}



export default SecurityCard
