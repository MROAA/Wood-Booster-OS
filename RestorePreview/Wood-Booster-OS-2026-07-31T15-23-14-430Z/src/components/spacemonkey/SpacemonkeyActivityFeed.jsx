function SpacemonkeyActivityFeed({
  activity = [],
}) {


  const items =
    activity.slice(0,5)





  return (

    <section

      className="
        rounded-2xl
        p-4
      "

      style={{

        background:
          "var(--wood-panel)",


        border:
          "1px solid var(--wood-border)"

      }}

    >



      <h3

        className="
          font-semibold
        "

      >

        📌 Spacemonkey Activity Feed

      </h3>






      {
        items.length > 0

        ?

        (

          <div

            className="
              mt-4
              space-y-3
            "

          >

            {
              items.map(

                item => (

                  <div

                    key={
                      item.id ||
                      item.createdAt
                    }


                    className="
                      rounded-xl
                      p-3
                    "


                    style={{

                      background:
                        "var(--wood-panel-dark)",


                      border:
                        "1px solid var(--wood-border)"

                    }}

                  >



                    <div

                      className="
                        flex
                        items-center
                        justify-between
                        gap-3
                      "

                    >



                      <p

                        className="
                          text-sm
                          font-semibold
                        "

                      >

                        {
                          item.title
                          ||
                          item.type
                        }

                      </p>





                      <span

                        className="
                          text-xs
                          uppercase
                        "

                        style={{

                          color:
                            "var(--wood-accent)"

                        }}

                      >

                        {
                          item.status
                        }

                      </span>




                    </div>






                    <p

                      className="
                        mt-2
                        text-sm
                      "

                      style={{

                        color:
                          "var(--wood-text)"

                      }}

                    >

                      {
                        item.message
                      }

                    </p>







                    <p

                      className="
                        mt-2
                        text-xs
                      "

                      style={{

                        color:
                          "var(--wood-muted)"

                      }}

                    >

                      {
                        item.module
                      }

                    </p>




                  </div>

                )

              )
            }



          </div>

        )

        :

        (

          <p

            className="
              mt-3
              text-sm
            "

            style={{

              color:
                "var(--wood-muted)"

            }}

          >

            Ei päivityksiä vielä.

          </p>

        )

      }




    </section>

  )

}



export default SpacemonkeyActivityFeed
