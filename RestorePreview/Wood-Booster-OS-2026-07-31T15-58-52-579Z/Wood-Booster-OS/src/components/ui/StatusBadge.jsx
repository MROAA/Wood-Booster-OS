function StatusBadge({

  status,

}){


  const color =

    status === "READY" ||
    status === "ONLINE"

    ?

    "var(--wood-green)"

    :

    status === "ACTIVE"

    ?

    "var(--wood-accent)"

    :

    "var(--wood-muted)"





  return (

    <span

      className="
        flex
        items-center
        gap-2
        text-xs
        font-semibold
        uppercase
        tracking-wide
      "

      style={{

        color

      }}

    >

      <span

        className="
          h-2
          w-2
          rounded-full
        "

        style={{

          background:
            color

        }}

      />


      {status}


    </span>

  )

}


export default StatusBadge
