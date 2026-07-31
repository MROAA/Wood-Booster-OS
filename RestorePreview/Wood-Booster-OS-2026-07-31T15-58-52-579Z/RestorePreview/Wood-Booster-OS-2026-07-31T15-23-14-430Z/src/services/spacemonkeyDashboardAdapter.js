export function adaptSpacemonkeyDashboard(
  dashboard
){


  return {


    status:

      dashboard?.status ||
      dashboard?.identity?.status ||
      "ACTIVE",







    identity:

    {

      name:
        dashboard?.identity?.name ||
        "Spacemonkey",


      role:
        "Wood-Booster OS Operator",


      creator:
        dashboard?.identity?.creator ||
        "Marc Järvinen",


      purpose:
        dashboard?.identity?.purpose ||
        "Building and operating Wood-Booster OS",


      status:
        dashboard?.status ||
        dashboard?.identity?.status ||
        "ACTIVE"

    },







    persona:

      dashboard?.persona?.persona ||
      null,







    knowledge:

      dashboard?.knowledge ||

      {

        status:
          "CHECKING",

        sources:
          0,

        domains:
          []

      },







    memory:

    {

      ...(dashboard?.memory || {}),

      persistent:
        true

    },







    worldModel:

      dashboard?.worldModel ||
      {},







    cognitive:

      dashboard?.cognitive ||
      {

        state:
          "idle",

        thinking:
          "-"

      },







    decision:

      dashboard?.decision ||
      {},







    activity:

      Array.isArray(
        dashboard?.activity
      )

      ?

      dashboard.activity

      :

      [],







    safety:

      dashboard?.safety ||
      {}



  }

}
