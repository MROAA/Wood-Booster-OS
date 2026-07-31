const MODULE_ID = "creator-intelligence-health-monitor"



const checks = []



function runHealthCheck({

  registry,

  runtime,

  security,

  context,

}){

  checks.length = 0



  checks.push({

    name:
      "creator-registry",

    status:
      registry
        ? "passed"
        : "failed",

  })



  checks.push({

    name:
      "creator-runtime",

    status:
      runtime === "active"
        ? "passed"
        : "failed",

  })



  checks.push({

    name:
      "creator-security",

    status:
      security
        ? "passed"
        : "failed",

  })



  checks.push({

    name:
      "creator-context",

    status:
      context
        ? "passed"
        : "failed",

  })



  const passed =
    checks.filter(
      item =>
        item.status === "passed"
    ).length



  const healthy =
    passed === checks.length



  return {

    moduleId:
      MODULE_ID,


    timestamp:
      new Date().toISOString(),


    status:
      healthy
        ? "healthy"
        : "degraded",


    score:
      Math.round(
        (passed / checks.length) * 100
      ),


    checks,

  }

}



function getHealthStatus(){

  const passed =
    checks.filter(
      item =>
        item.status === "passed"
    ).length



  return {

    healthy:
      passed === checks.length
      &&
      checks.length > 0,


    score:
      checks.length
        ?
        Math.round(
          (passed / checks.length) * 100
        )
        :
        0,


    timestamp:
      new Date().toISOString(),

  }

}



export {

  MODULE_ID,

  runHealthCheck,

  getHealthStatus,

}
