function MonitorCard({
  connection,
  lastUpdate,
}) {


  return (

    <section
      className="
        card
        p-6
        wood-hover
      "
    >

      <h2>
        Pulse Monitor
      </h2>



      <div
        className="
          mt-5
          space-y-3
        "
      >

        <p>
          Connection:
          {" "}
          {connection}
        </p>



        <p>
          Last update:
          {" "}
          {
            lastUpdate
              ?
              lastUpdate.toLocaleTimeString()
              :
              "-"
          }
        </p>


      </div>


    </section>

  )

}



export default MonitorCard
