import spacemonkey from "../../assets/branding/Spacemonkey.png"



function SpacemonkeyAvatar() {


  return (

    <div
      className="
        flex
        flex-col
        items-center
        gap-4
      "
    >


      <div
        className="
          w-28
          h-28
          overflow-hidden
          rounded-xl
          bg-[var(--wood-bg)]
          flex
          items-center
          justify-center
          border
          border-[var(--wood-border)]
          wood-float
        "
      >

        <img
          src={spacemonkey}
          alt="Spacemonkey System Operator"
          className="
            w-28
            h-28
            object-contain
          "
        />


      </div>




      <div
        className="
          text-center
        "
      >

        <p
          className="
            text-lg
            text-[var(--wood-text)]
          "
        >
          Spacemonkey
        </p>


        <p
          className="
            mt-1
            text-xs
            uppercase
            tracking-widest
            text-[var(--wood-muted)]
          "
        >
          System Operator
        </p>


      </div>


    </div>

  )

}


export default SpacemonkeyAvatar
