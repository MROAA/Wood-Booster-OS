import {
  useState,
} from "react"



function CollapsibleSection({
  title,
  summary,
  defaultOpen = false,
  children,
}) {


  const [
    isOpen,
    setIsOpen,
  ] = useState(
    defaultOpen
  )


  return (

    <section
      className="
        panel
        p-6
      "
    >

      <div
        className="
          flex
          flex-wrap
          items-center
          justify-between
          gap-3
        "
      >

        <div>

          <p
            className="
              text-lg
              font-semibold
            "
          >

            {title}

          </p>


          {
            !isOpen &&
            summary &&
            (

              <p
                className="
                  mt-1
                  text-sm
                  text-[var(--wood-muted)]
                "
              >

                {summary}

              </p>

            )
          }

        </div>


        <button

          type="button"

          onClick={() =>
            setIsOpen(
              open =>
                !open
            )
          }

          className="
            text-sm
            font-semibold
            text-[var(--wood-accent)]
            hover:opacity-80
          "

        >

          {
            isOpen
            ?
            "Piilota ▴"
            :
            "Näytä ▾"
          }

        </button>

      </div>


      {
        isOpen &&
        (

          <div
            className="
              mt-5
            "
          >

            {children}

          </div>

        )
      }

    </section>

  )

}



export default CollapsibleSection
