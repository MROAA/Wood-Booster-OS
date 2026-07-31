function WorkspaceHeader(){

  return (

    <section

      className="
        relative
        h-24
        w-full
        shrink-0
        overflow-hidden
        rounded-xl
      "

      style={{

        backgroundImage:
          "url('/workspace-header.jpg')",

        backgroundSize:
          "cover",

        backgroundPosition:
          "center",

        border:
          "1px solid var(--wood-border)"

      }}

    >


      <div

        className="
          absolute
          inset-0
          flex
          items-center
          justify-center
        "

        style={{

          background:
            "rgba(10,8,6,0.45)"

        }}

      >


        <div

          className="
            text-center
          "

        >

          <h1

            className="
              text-lg
              font-semibold
              tracking-wide
            "

          >

            WOOD-BOOSTER AI

          </h1>


          <p

            className="
              mt-1
              text-[11px]
              uppercase
              tracking-[0.35em]
            "

            style={{

              color:
                "var(--wood-muted)"

            }}

          >

            AI työympäristö

          </p>


        </div>


      </div>


    </section>

  )

}


export default WorkspaceHeader
