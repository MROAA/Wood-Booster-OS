import PulseCard from "./PulseCard"

import StatusGlow from "./StatusGlow"





function GitSyncCard({
  pulse,
}) {


  const summary =
    pulse?.gitSummary



  const health =
    summary?.health?.status





  const statusType =
    health === "healthy"
      ?
      "healthy"
      :
      health === "changes"
        ?
        "warning"
        :
        "error"





  return (

    <PulseCard
      title="Git Sync"
    >


      <div
        className="
          space-y-3
        "
      >


        <StatusGlow
          label="Health"
          value={
            summary?.health?.label
            ||
            "-"
          }
          status={statusType}
        />



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


    </PulseCard>

  )

}



export default GitSyncCard
