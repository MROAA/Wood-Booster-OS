import {
  useState,
} from "react"





function SpacemonkeyApproval(){


  const [
    approved,
    setApproved,
  ] = useState(null)





  const requests = [

    {
      id:
        1,

      name:
        "Restart Core",

      description:
        "Käynnistä Spacemonkey Core uudelleen.",

      risk:
        "MEDIUM",

    },


    {
      id:
        2,

      name:
        "Create Snapshot",

      description:
        "Luo uusi järjestelmän palautuspiste.",

      risk:
        "LOW",

    },

  ]







  function approve(request){


    setApproved(

      `${request.name} approved`

    )


  }







  function reject(request){


    setApproved(

      `${request.name} cancelled`

    )


  }







  return (

    <section className="
      rounded-2xl
      border
      border-neutral-800
      bg-neutral-900
      p-6
    ">


      <header>


        <h2 className="
          text-xl
          font-bold
          text-white
        ">

          Command Approval

        </h2>



        <p className="
          mt-2
          text-sm
          text-neutral-400
        ">

          Spacemonkey turvallinen hyväksyntäkerros.

        </p>


      </header>







      <div className="
        mt-6
        space-y-4
      ">


        {
          requests.map(

            request => (

              <article

                key={
                  request.id
                }

                className="
                  rounded-xl
                  border
                  border-neutral-800
                  bg-black/30
                  p-5
                "

              >


                <div className="
                  flex
                  items-start
                  justify-between
                  gap-4
                ">


                  <div>


                    <h3 className="
                      font-semibold
                      text-white
                    ">

                      {request.name}

                    </h3>



                    <p className="
                      mt-2
                      text-sm
                      text-neutral-400
                    ">

                      {request.description}

                    </p>


                  </div>





                  <span className="
                    rounded-full
                    border
                    border-neutral-700
                    px-3
                    py-1
                    text-xs
                    text-neutral-400
                  ">

                    {request.risk}

                  </span>


                </div>







                <div className="
                  mt-5
                  flex
                  gap-3
                ">


                  <button

                    onClick={()=>approve(request)}

                    className="
                      rounded-lg
                      border
                      border-green-800
                      px-4
                      py-2
                      text-sm
                      text-green-400
                      transition
                      hover:bg-green-900/20
                    "

                  >

                    Approve

                  </button>





                  <button

                    onClick={()=>reject(request)}

                    className="
                      rounded-lg
                      border
                      border-red-900
                      px-4
                      py-2
                      text-sm
                      text-red-400
                      transition
                      hover:bg-red-900/20
                    "

                  >

                    Reject

                  </button>


                </div>


              </article>

            )

          )
        }


      </div>







      {
        approved && (

          <div className="
            mt-6
            rounded-xl
            border
            border-neutral-800
            bg-black/30
            p-4
            text-sm
            text-green-400
          ">

            {approved}

          </div>

        )
      }


    </section>

  )

}







export default SpacemonkeyApproval
