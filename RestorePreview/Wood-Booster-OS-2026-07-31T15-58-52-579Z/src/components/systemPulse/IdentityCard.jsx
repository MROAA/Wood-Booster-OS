function IdentityCard({
  core,
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
        Spacemonkey Identity
      </h2>



      <div
        className="
          mt-5
          space-y-3
        "
      >

        <p>
          Name:
          {" "}
          {
            core?.identity?.name
            ||
            "Checking..."
          }
        </p>



        <p>
          Creator:
          {" "}
          {
            core?.identity?.creator
            ||
            "-"
          }
        </p>



        <p>
          Version:
          {" "}
          {
            core?.version
            ||
            "-"
          }
        </p>


      </div>


    </section>

  )

}



export default IdentityCard
