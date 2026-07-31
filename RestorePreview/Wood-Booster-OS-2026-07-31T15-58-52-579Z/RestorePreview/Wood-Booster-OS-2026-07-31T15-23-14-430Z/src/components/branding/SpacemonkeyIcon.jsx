import spacemonkey from "../../assets/branding/Spacemonkey.png"



function SpacemonkeyIcon() {


  return (

    <div
      className="
        w-8
        h-8
        overflow-hidden
        rounded-lg
        bg-[var(--wood-bg)]
        border
        border-[var(--wood-border)]
        flex
        items-center
        justify-center
      "
    >

      <img
        src={spacemonkey}
        alt="Spacemonkey"
        className="
          w-10
          h-10
          object-contain
        "
      />


    </div>

  )

}


export default SpacemonkeyIcon
