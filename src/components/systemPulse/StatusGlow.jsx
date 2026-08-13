function StatusGlow({
  label,
  value,
  status = "healthy",
}) {


  const style =
    status === "healthy"
      ?
      "text-green-400 border-green-700 bg-green-950/20"
      :
      status === "warning"
        ?
        "text-yellow-400 border-yellow-700 bg-yellow-950/20"
        :
        "text-red-400 border-red-700 bg-red-950/20"





  return (

    <div
      className={`
        inline-flex
        items-center
        gap-3
        rounded-lg
        border
        px-4
        py-2
        transition-colors
        duration-300
        ${style}
      `}
    >

      <span
        className="
          h-2
          w-2
          rounded-full
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
