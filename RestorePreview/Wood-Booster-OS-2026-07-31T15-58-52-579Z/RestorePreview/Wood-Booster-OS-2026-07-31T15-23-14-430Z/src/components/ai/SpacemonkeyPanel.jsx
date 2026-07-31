import SpacemonkeyAvatar from "../branding/SpacemonkeyAvatar"



function SpacemonkeyPanel() {


  return (

    <aside
      className="
        h-screen
        w-full
        bg-[var(--wood-panel)]
        px-8
        py-10
        flex
        flex-col
        items-center
        border-l
        border-[var(--wood-border)]
      "
    >



      <div
        className="
          text-center
        "
      >

        <h2
          className="
            text-3xl
            brand-font
            text-[var(--wood-text)]
          "
        >
          Spacemonkey
        </h2>


        <p
          className="
            mt-2
            text-sm
            uppercase
            tracking-widest
            text-[var(--wood-muted)]
          "
        >
          System Operator
        </p>


      </div>





      <div
        className="
          mt-8
        "
      >

        <SpacemonkeyAvatar />

      </div>





      <div
        className="
          mt-10
          w-full
          rounded-xl
          border
          border-[var(--wood-border)]
          bg-[var(--wood-card)]
          p-6
        "
      >


        <PanelTitle>
          System Status
        </PanelTitle>


        <div
          className="
            mt-6
            space-y-5
          "
        >

          <Status
            name="Core"
            value="READY"
          />


          <Status
            name="System Pulse"
            value="READY"
          />


          <Status
            name="Security"
            value="ACTIVE"
          />


        </div>


      </div>





      <div
        className="
          mt-6
          w-full
          rounded-xl
          border
          border-[var(--wood-border)]
          bg-[var(--wood-card)]
          p-6
        "
      >


        <PanelTitle>
          Capabilities
        </PanelTitle>


        <div
          className="
            mt-5
            space-y-3
          "
        >

          <Capability name="Linux" />

          <Capability name="Node.js" />

          <Capability name="React" />

          <Capability name="Docker" />


        </div>


      </div>



    </aside>

  )

}





function PanelTitle({
  children
}) {


  return (

    <h3
      className="
        text-xs
        uppercase
        tracking-widest
        text-[var(--wood-muted)]
      "
    >
      {children}
    </h3>

  )

}





function Status({
  name,
  value
}) {


  return (

    <div
      className="
        flex
        justify-between
        items-center
      "
    >

      <span
        className="
          text-sm
          text-[var(--wood-muted)]
        "
      >
        {name}
      </span>


      <span
        className="
          text-sm
          font-medium
          text-[var(--wood-accent)]
        "
      >
        {value}
      </span>


    </div>

  )

}





function Capability({
  name
}) {


  return (

    <div
      className="
        flex
        items-center
        gap-3
        text-sm
        text-[var(--wood-text)]
      "
    >

      <span
        className="
          h-2
          w-2
          rounded-full
          bg-[var(--wood-accent)]
        "
      />


      {name}


    </div>

  )

}



export default SpacemonkeyPanel
