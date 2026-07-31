import spacemonkey from "../../assets/branding/Spacemonkey.png"



function DashboardSystemPanel() {


  return (

    <div
      className="
        h-full
        flex
        flex-col
        gap-4
      "
    >


      <h2
        className="
          text-xl
          uppercase
          tracking-widest
          text-[var(--wood-muted)]
        "
      >
        System Core
      </h2>





      <div
        className="
          card
          p-5
        "
      >

        <p
          className="
            text-sm
            uppercase
            tracking-widest
            text-[var(--wood-muted)]
          "
        >
          🟢 System
        </p>


        <p
          className="
            mt-3
            text-xl
          "
        >
          Online
        </p>

      </div>





      <div
        className="
          card
          p-5
        "
      >

        <p
          className="
            text-sm
            uppercase
            tracking-widest
            text-[var(--wood-muted)]
          "
        >
          🐒 Operator
        </p>




        <div
          className="
            mt-5
            flex
            items-center
            gap-5
          "
        >

          <img
            src={spacemonkey}
            alt="Spacemonkey"
            className="
              w-20
              h-20
              rounded-xl
              object-cover
              border
              border-[var(--wood-border)]
            "
          />



          <div>

            <p
              className="
                text-xl
                text-white
              "
            >
              Spacemonkey
            </p>


            <p
              className="
                mt-2
                text-base
                text-green-400
              "
            >
              ● Active
            </p>


          </div>


        </div>





        <div
          className="
            mt-5
            space-y-2
            text-base
            text-[var(--wood-text)]
          "
        >

          <p>
            Role: Core Operator
          </p>


          <p>
            Mode: System
          </p>


        </div>


      </div>





      <div
        className="
          card
          p-5
        "
      >

        <p
          className="
            text-sm
            uppercase
            tracking-widest
            text-[var(--wood-muted)]
          "
        >
          🔒 Security
        </p>


        <p
          className="
            mt-3
            text-xl
          "
        >
          Protected
        </p>


      </div>





      <div
        className="
          card
          p-5
        "
      >

        <p
          className="
            text-sm
            uppercase
            tracking-widest
            text-[var(--wood-muted)]
          "
        >
          ⚡ Runtime
        </p>


        <p
          className="
            mt-3
            text-xl
          "
        >
          Ready
        </p>


      </div>





      <div
        className="
          card
          p-5
        "
      >

        <p
          className="
            text-sm
            uppercase
            tracking-widest
            text-[var(--wood-muted)]
          "
        >
          📦 Version
        </p>


        <p
          className="
            mt-3
            text-lg
          "
        >
          Wood-Booster OS 1.0.0
        </p>


      </div>


    </div>

  )

}


export default DashboardSystemPanel
