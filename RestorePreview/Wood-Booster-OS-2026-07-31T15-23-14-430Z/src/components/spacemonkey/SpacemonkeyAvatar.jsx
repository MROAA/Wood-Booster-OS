function SpacemonkeyAvatar(){


  return (

    <div

      className="
        flex
        justify-center
        py-8
      "

    >





      <div

        className="
          relative
          flex
          items-center
          justify-center
          rounded-full
        "

        style={{

          width:
            "144px",


          height:
            "144px",


          background:
            "var(--wood-panel-dark)",


          border:
            "1px solid var(--wood-border)",


          boxShadow:
            "0 0 34px rgba(94,234,212,0.12)"

        }}

      >






        <div

          className="
            overflow-hidden
            rounded-full
          "

          style={{

            width:
              "128px",


            height:
              "128px",


            border:
              "1px solid var(--wood-accent)"

          }}

        >

          <img

            src="/spacemonkey.png"

            alt="Spacemonkey"

            className="
              h-full
              w-full
              object-cover
            "

          />

        </div>





      </div>






    </div>

  )

}





export default SpacemonkeyAvatar
