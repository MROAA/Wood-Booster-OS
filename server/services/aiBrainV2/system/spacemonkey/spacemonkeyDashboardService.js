import {
  getSpacemonkeySnapshot,
} from "../../../../../Spacemonkey/core/spacemonkeyCoreSnapshot.js"


import {
  runHealthCheck,
} from "../../../../../Spacemonkey/core/spacemonkeyHealthMonitor.js"


import {
  getRuntimeConnectorStatus,
  getSpacemonkeyRuntime,
} from "./spacemonkeyRuntimeConnector.js"


import {
  createDashboardData,
} from "./spacemonkeyDevelopmentDashboardDataEngine.js"


import {
  getCurrentState,
} from "./spacemonkeySystemStateEngine.js"


import {
  getTasks,
} from "./spacemonkeyTaskIntelligenceEngine.js"


import {
  getWorkflowHistory,
} from "./spacemonkeyDevelopmentWorkflowEngine.js"


import {
  getRecentAudits,
} from "./spacemonkeyExecutionAuditEngine.js"


import {
  getReflectionHistory,
} from "./spacemonkeySelfReflectionEngine.js"


import {
  getImprovementMemory,
} from "./spacemonkeyImprovementMemoryEngine.js"


import {
  getDashboardActivity,
} from "./spacemonkeyDashboardActivityBridge.js"


import {
  getRecentSpacemonkeyActivities,
} from "./spacemonkeyActivityStore.js"


import {
  adaptSpacemonkeyActivity,
} from "./spacemonkeyActivityAdapter.js"


import {
  getUnifiedRuntimeState,
} from "./spacemonkeyRuntimeStateBridge.js"


import {
  getCognitiveState,
} from "./spacemonkeyCognitiveStateBridge.js"


import {
  getDecisionState,
} from "./spacemonkeyDecisionStateBridge.js"


import {
  getMemoryIntelligence,
} from "./spacemonkeyMemoryIntelligenceBridge.js"





const dashboardHistory = []







async function getSpacemonkeyDashboard({

  prisma,

} = {}){


  const snapshot =

    getSpacemonkeySnapshot()



  const health =

    runHealthCheck()



  const runtime =

    snapshot.core.runtime







  const runtimeState =

    await getUnifiedRuntimeState({

      prisma

    })







  const cognitiveState =

    await getCognitiveState({

      prisma

    })







  const decisionState =

    await getDecisionState({

      prisma

    })







  const memoryIntelligence =

    await getMemoryIntelligence({

      prisma

    })







  const runtimeConnector =

  {

    status:

      getRuntimeConnectorStatus(),


    current:

      getSpacemonkeyRuntime()

  }







  const activityState =

    getDashboardActivity()







  const rawDatabaseActivity =

    await getRecentSpacemonkeyActivities({

      prisma

    })







  const databaseActivity =

    adaptSpacemonkeyActivity(

      rawDatabaseActivity

    )







  const development =

    createDashboardData({

      systemState:

        getCurrentState(),


      tasks:

        getTasks(),


      workflows:

        getWorkflowHistory(),


      audits:

        getRecentAudits(),


      reflections:

        getReflectionHistory(),


      improvements:

        getImprovementMemory()

    })







  const dashboard = {


    system:

      "Spacemonkey Dashboard",



    version:

      "3.6.0",



    status:

      health.status,



    identity:

    {

      name:

        snapshot.core.identity.identity.name,


      version:

        snapshot.core.identity.identity.version,


      purpose:

        snapshot.core.identity.identity.purpose

    },



    health:

      health.checks,



    runtime:

    {

      mode:

        runtime.mode,


      safeMode:

        runtime.safeMode,


      autonomousActions:

        runtime.autonomousActions

    },



    runtimeState,



    cognitiveState,



    decisionState,



    memoryIntelligence,



    runtimeConnector,



    modules:

      runtime.modules.active,



    memory:

      snapshot.core.memory,



    development:

      development.development,



    decision:

      development.decision,



    planning:

      development.planning,



    activity:

      databaseActivity.length > 0

        ?

        databaseActivity

        :

        (
          activityState.activity

          ?

          [
            activityState.activity
          ]

          :

          development.activity
        ),



    statistics:

      development.statistics,



    createdAt:

      new Date().toISOString()

  }





  dashboardHistory.push(

    dashboard

  )





  return dashboard

}







function getDashboardHistory(){


  return [

    ...dashboardHistory

  ]

}







function getDashboardStatus(){


  return {


    engine:

      "Spacemonkey Dashboard Service",



    version:

      "3.6.0",



    requests:

      dashboardHistory.length

  }

}







export {

  getSpacemonkeyDashboard,

  getDashboardHistory,

  getDashboardStatus

}
