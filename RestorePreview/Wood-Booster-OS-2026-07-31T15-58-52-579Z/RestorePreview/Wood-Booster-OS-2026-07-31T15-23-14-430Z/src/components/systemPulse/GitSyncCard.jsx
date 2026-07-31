function GitSyncCard({
  pulse,
}) {


  const summary =
    pulse?.gitSummary



  const health =
    summary?.health?.status



  const healthStyle =
    health === "healthy"
      ?
      "text-green-400 border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.7)]"
      :
      health === "changes"
        ?
        "text-yellow-400 border-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.7)]"
        :
        "text-red-400 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.7)]"





  return (

    <section
      className="
        card
        p-6
        wood-hover
      "
    >

      <h2>
        Git Sync
      </h2>




      <div
        className="
          mt-5
          space-y-3
        "
      >


        <div
          className={`
            inline-flex
            items-center
            gap-2
            rounded-full
            border
            px-4
            py-2
            transition-all
            duration-500
            ${healthStyle}
          `}
        >

          <span
            className="
              h-3
              w-3
              rounded-full
              animate-pulse
              bg-current
            "
          />

          <span>
            {
              summary?.health?.label
              ||
              "-"
            }
          </span>

        </div>





        <p>
          Status:

          {" "}

          {
            summary?.status
            ||
            "-"
          }

        </p>



        <p>
          Repository:

          {" "}

          {
            summary?.repository
            ||
            "-"
          }

        </p>



        <p>
          Branch:

          {" "}

          {
            summary?.branch
            ||
            "-"
          }

        </p>



        <p>
          Commit:

          {" "}

          {
            summary?.commit
            ||
            "-"
          }

        </p>



        <p>
          Changes:

          {" "}

          {
            summary?.changedFiles
            ??
            0
          }

          {" "}
          files

        </p>



        <p>
          Watcher:

          {" "}

          {
            summary?.watcherActive
            ?
            "🟢 Running"
            :
            "🔴 Stopped"
          }

        </p>



        <p>
          History:

          {" "}

          {
            summary?.historyCount
            ??
            0
          }

          {" "}
          events

        </p>



        <p>
          Last Event:

          {" "}

          {
            summary?.lastEvent
            ||
            "-"
          }

        </p>



      </div>


    </section>

  )

}



export default GitSyncCard
