import SpacemonkeyDashboard from "../components/spacemonkey/SpacemonkeyDashboard"



function Spacemonkey(){

  return (

    <div
      className="
        h-full
        overflow-auto
        p-6
      "
    >

      <div
        className="
          mx-auto
          max-w-7xl
        "
      >

        <div
          className="
            mb-6
          "
        >

          <h1
            className="
              text-3xl
              font-bold
              text-white
            "
          >
            🛰️ Spacemonkey Command Center
          </h1>


          <p
            className="
              mt-2
              text-neutral-400
            "
          >
            Marcin digitaalinen jatke —
            AI-kehitysjärjestelmä, joka kasvaa vaiheittain.
          </p>

        </div>



        <SpacemonkeyDashboard />

      </div>

    </div>

  )

}


export default Spacemonkey
