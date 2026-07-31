function EnvironmentCard({
  pulse,
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
        Environment
      </h2>



      <div
        className="
          mt-5
          space-y-3
        "
      >

        <p>
          OS:
          {" "}
          {
            pulse?.environment?.operatingSystem
            ||
            "-"
          }
        </p>



        <p>
          Kernel:
          {" "}
          {
            pulse?.environment?.kernel
            ||
            "-"
          }
        </p>



        <p>
          Host:
          {" "}
          {
            pulse?.environment?.hostname
            ||
            "-"
          }
        </p>


      </div>


    </section>

  )

}



export default EnvironmentCard
