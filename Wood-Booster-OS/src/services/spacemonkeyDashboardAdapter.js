function resolveRuntimeState(
  dashboard
){

  return (
    dashboard?.runtimeState ||
    {}
  )

}







export function adaptSpacemonkeyDashboard(
  dashboard
){

  const runtimeState =
    resolveRuntimeState(
      dashboard
    )


  const activity =
    runtimeState.activity || {}





  return {


    system:

    {

      status:

        dashboard?.status ||
        "READY",


      system:

        dashboard?.system ||
        "Spacemonkey Dashboard"

    },







    planning:

    {

      nextStep:

        dashboard?.planning?.nextStep ||
        "Odottaa tehtävää",


      reason:

        dashboard?.planning?.reason ||
        "Spacemonkey tarvitsee projektin tai tavoitteen."

    },







    decision:

    {

      recommendation:

        dashboard?.decision?.recommendation ||
        "Spacemonkey odottaa lisää tietoa.",


      confidence:

        dashboard?.decision?.confidence ||
        "-",


      reason:

        dashboard?.decision?.reason ||
        "Ei perustelua"

    },







    activity:


      dashboard?.activity?.length

      ?

      dashboard.activity

      :

      [

        {

          name:
            activity.lastAction ||
            "idle",

          status:
            runtimeState.state ||
            "idle"

        }

      ],







    memory:

    {

      status:

        dashboard?.memory ||
        "Ei uusia muistiehdotuksia."

    }

  }

}
