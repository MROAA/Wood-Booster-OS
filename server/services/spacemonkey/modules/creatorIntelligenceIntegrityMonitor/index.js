const MODULE_ID = "creator-intelligence-integrity-monitor"



const integrityChecks = []



function createIntegrityCheck({

  source,

  data,

  expectedChecksum,

}){

  const checksum =
    generateChecksum(data)



  const valid =
    !expectedChecksum
    ||
    checksum === expectedChecksum



  const result = {

    id:
      `integrity-check-${Date.now()}`,

    timestamp:
      new Date().toISOString(),


    source,


    checksum,


    expectedChecksum:
      expectedChecksum || null,


    status:
      valid
        ? "valid"
        : "invalid",

  }


  integrityChecks.push(result)


  return result

}



function generateChecksum(data){

  const content =
    JSON.stringify(data)



  return Buffer
    .from(content)
    .toString("base64")
    .slice(0,32)

}



function compareVersions({

  current,

  previous,

}){

  return {

    changed:
      JSON.stringify(current)
      !==
      JSON.stringify(previous),


    timestamp:
      new Date().toISOString(),

  }

}



function getIntegrityChecks(){

  return {

    moduleId:
      MODULE_ID,

    count:
      integrityChecks.length,

    checks:
      integrityChecks,

  }

}



function getLatestChecks(){

  return integrityChecks.slice(-10)

}



function getIntegrityStatus(){

  const invalid =
    integrityChecks.filter(
      item =>
        item.status === "invalid"
    )



  return {

    healthy:
      invalid.length === 0,


    totalChecks:
      integrityChecks.length,


    failedChecks:
      invalid.length,


    timestamp:
      new Date().toISOString(),

  }

}



export {

  MODULE_ID,

  createIntegrityCheck,

  compareVersions,

  getIntegrityChecks,

  getLatestChecks,

  getIntegrityStatus,

}
