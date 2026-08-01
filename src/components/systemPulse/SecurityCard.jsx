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

    <section
      className="
        card
        p-6
        wood-hover
      "
    >

      <h2>
        Security
      </h2>


      <div
        className="
          mt-5
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
              "
            >
              {security.message}

            </div>

          )
        }


      </div>


    </section>

  )

}



export default SecurityCard
