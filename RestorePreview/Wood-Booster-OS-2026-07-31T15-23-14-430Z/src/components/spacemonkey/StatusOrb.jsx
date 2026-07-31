function StatusOrb({
  status,
  cognitive
}) {


  const currentStatus =
    String(
      status || ""
    ).toLowerCase()



  const currentCognitive =
    String(
      cognitive || ""
    ).toLowerCase()





  let label =
    "CHECKING"



  let style =
    "bg-[var(--wood-muted)]"





  if (
    currentStatus === "active" ||
    currentStatus === "online"
  ) {

    label =
      "ONLINE"

    style =
      "bg-[var(--wood-accent)]"

  }





  if (
    currentCognitive === "planning" ||
    currentCognitive === "thinking"
  ) {

    label =
      "THINKING"

    style =
      "bg-yellow-400"

  }





  if (
    currentStatus === "error" ||
    currentStatus === "offline"
  ) {

    label =
      "ERROR"

    style =
      "bg-red-500"

  }





  return (

    <div
      className="
        flex
        items-center
        gap-4
      "
    >

      <div
        className={`
          h-5
          w-5
          rounded-full
          ${style}
          system-pulse
        `}
      />


      <div>

        <p
          className="
            text-xs
            uppercase
            tracking-widest
            text-[var(--wood-muted)]
          "
        >
          Core Status
        </p>


        <p
          className="
            mt-1
            text-sm
            text-[var(--wood-text)]
          "
        >
          {label}
        </p>


      </div>


    </div>

  )

}


export default StatusOrb
