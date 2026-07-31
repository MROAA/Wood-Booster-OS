function DashboardWorkspaceStatus() {


  return (

    <section
      className="
        card
        p-5
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
        Workspace Status
      </h2>




      <div
        className="
          mt-4
          grid
          grid-cols-4
          gap-3
        "
      >


        <div
          className="
            rounded-xl
            border
            border-[var(--wood-border)]
            p-4
          "
        >

          <p className="text-xs text-[var(--wood-muted)]">
            PROJECTS
          </p>

          <p className="mt-2">
            1 Active
          </p>

        </div>




        <div
          className="
            rounded-xl
            border
            border-[var(--wood-border)]
            p-4
          "
        >

          <p className="text-xs text-[var(--wood-muted)]">
            KNOWLEDGE
          </p>

          <p className="mt-2">
            Ready
          </p>

        </div>




        <div
          className="
            rounded-xl
            border
            border-[var(--wood-border)]
            p-4
          "
        >

          <p className="text-xs text-[var(--wood-muted)]">
            MEMORY
          </p>

          <p className="mt-2">
            Active
          </p>

        </div>




        <div
          className="
            rounded-xl
            border
            border-[var(--wood-border)]
            p-4
          "
        >

          <p className="text-xs text-[var(--wood-muted)]">
            AGENTS
          </p>

          <p className="mt-2">
            Online
          </p>

        </div>


      </div>


    </section>

  )

}


export default DashboardWorkspaceStatus
