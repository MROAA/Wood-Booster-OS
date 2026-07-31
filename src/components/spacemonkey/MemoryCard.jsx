function MemoryCard({
  memory
}) {


  return (

    <section
      className="
        card
        p-6
        wood-hover
      "
    >

      <h2
        className="
          text-sm
          uppercase
          tracking-widest
          text-[var(--wood-muted)]
        "
      >
        💾 Memory
      </h2>





      <div
        className="
          mt-6
          space-y-5
        "
      >


        <div>

          <p
            className="
              text-xs
              uppercase
              tracking-widest
              text-[var(--wood-muted)]
            "
          >
            Engine
          </p>


          <p
            className="
              mt-2
              text-lg
            "
          >
            {
              memory?.engine ||
              "Checking..."
            }

          </p>


        </div>





        <div>

          <p
            className="
              text-xs
              uppercase
              tracking-widest
              text-[var(--wood-muted)]
            "
          >
            Version
          </p>


          <p
            className="
              mt-2
              text-lg
            "
          >
            {
              memory?.version ||
              "-"
            }

          </p>


        </div>





        <div>

          <p
            className="
              text-xs
              uppercase
              tracking-widest
              text-[var(--wood-muted)]
            "
          >
            Saved Memories
          </p>


          <p
            className="
              mt-2
              text-3xl
              text-[var(--wood-accent)]
            "
          >
            {
              memory?.saved ?? 0
            }

          </p>


        </div>





        <div>

          <p
            className="
              text-xs
              uppercase
              tracking-widest
              text-[var(--wood-muted)]
            "
          >
            Persistence
          </p>


          <p
            className="
              mt-2
              text-sm
            "
          >

            {
              memory?.persistent
              ?
              "ACTIVE"
              :
              "CHECKING"
            }

          </p>


        </div>


      </div>


    </section>

  )

}


export default MemoryCard	
