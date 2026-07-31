function DashboardLayout({
  sidebar,
  main,
  right
}) {


  return (

    <div
      className="
        w-screen
        h-screen
        overflow-hidden
        grid
        grid-cols-[250px_minmax(0,1fr)_300px]
        gap-5
        p-5
        bg-[var(--wood-bg)]
      "
    >





      <aside
        className="
          h-full
          rounded-xl
          border
          border-[var(--wood-border)]
          bg-[var(--wood-card)]
          p-5
          overflow-hidden
        "
      >

        {sidebar}

      </aside>





      <main
        className="
          min-w-0
          h-full
          overflow-hidden
        "
      >

        {main}

      </main>





      <aside
        className="
          h-full
          rounded-xl
          border
          border-[var(--wood-border)]
          bg-[var(--wood-card)]
          p-4
          overflow-y-auto
        "
      >

        {right}

      </aside>


    </div>

  )

}


export default DashboardLayout
