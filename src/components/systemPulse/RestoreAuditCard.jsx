/*
WOOD-BOOSTER HQ

SYSTEM PULSE

RESTORE AUDIT CARD

Vastuut:

- näyttää restore audit historian
- näyttää viimeisimmät palautustapahtumat

Ei:

- suorita palautusta
- muuta järjestelmää
*/

function RestoreAuditCard({
  audit
}) {

  if(
    !audit ||
    audit.length === 0
  ){

    return null

  }



  const events =
    [...audit]
      .reverse()



  return (

    <div
      className="
        p-6
        rounded-xl
        border
        border-[var(--wood-border)]
        bg-[var(--wood-panel)]
        space-y-4
      "
    >

      <h3
        className="
          text-lg
          font-semibold
          text-[var(--wood-text)]
        "
      >
        Restore Audit
      </h3>



      <div>
        Events:

        {" "}

        {audit.length}

      </div>



      {
        events.map(
          (event,index)=>(

            <div
              key={
                event.id ||
                index
              }
              className="
                p-4
                rounded-lg
                border
                border-[var(--wood-border)]
                space-y-2
              "
            >

              <div>
                Event:

                {" "}

                {event.event}

              </div>



              <div>
                Snapshot:

                {" "}

                {event.snapshot || "-"}

              </div>



              <div>
                Status:

                {" "}

                {event.status}

              </div>



              <div>
                Operator:

                {" "}

                {event.operator}

              </div>



              <div>
                Created:

                {" "}

                {event.createdAt}

              </div>

            </div>

          )

        )
      }


    </div>

  )

}

export default RestoreAuditCard
