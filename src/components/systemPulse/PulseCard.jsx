function PulseCard({
  title,
  children,
  className = "",
}) {


  return (

    <section
      className={`
        card
        p-6
        ${className}
      `}
    >

      {
        title &&
        (
          <h2
            className="
              text-lg
              font-medium
              text-[var(--wood-text)]
            "
          >
            {title}
          </h2>
        )
      }


      <div
        className="
          mt-5
        "
      >
        {children}
      </div>


    </section>

  )

}



export default PulseCard
