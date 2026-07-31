function StatusGlow({
  label,
  value,
  status = "healthy",
}) {


  const style =
    status === "healthy"
      ?
      "text-green-400 border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.7)]"
      :
      status === "warning"
        ?
        "text-yellow-400 border-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.7)]"
        :
        "text-red-400 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.7)]"





  return (

    <div
      className={`
        inline-flex
        items-center
        gap-2
        rounded-full
        border
        px-4
        py-2
        transition-all
        duration-500
        ${style}
      `}
    >

      <span
        className="
          h-3
          w-3
          rounded-full
          animate-pulse
          bg-current
        "
      />

      <span>
        {label}

        {" "}

        {value}

      </span>


    </div>

  )

}



export default StatusGlow
