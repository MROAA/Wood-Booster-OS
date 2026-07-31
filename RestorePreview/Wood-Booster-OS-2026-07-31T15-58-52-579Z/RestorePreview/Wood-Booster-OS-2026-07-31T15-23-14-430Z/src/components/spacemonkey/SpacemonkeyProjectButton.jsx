import {
  activateSpacemonkeyProject,
} from "../../services/spacemonkeyProjectBridge"



function SpacemonkeyProjectButton({
  project,
}) {


  function activate(){


    const result =
      activateSpacemonkeyProject(
        project
      )


    console.log(
      "Spacemonkey project activated:",
      result
    )


  }





  return (

    <button

      onClick={activate}

      className="
        rounded-xl
        px-4
        py-2
        text-sm
        transition
      "

      style={{

        background:
          "var(--wood-panel)",


        border:
          "1px solid var(--wood-border)",


        color:
          "var(--wood-text)"

      }}

    >

      🛰️ Aseta Spacemonkey työtilaan

    </button>

  )

}



export default SpacemonkeyProjectButton
