const MODULE_ID = "personality-version-control"



const versions = []



function createVersion({

  version,

  change,

  reason,

  approvedBy,

}){

  const record = {

    id:
      `personality-version-${Date.now()}`,

    timestamp:
      new Date().toISOString(),

    version,

    change,

    reason,

    approvedBy,

    status:
      "approved",

  }


  versions.push(record)


  return record

}



function getVersions(){

  return {

    moduleId:
      MODULE_ID,

    timestamp:
      new Date().toISOString(),

    count:
      versions.length,

    versions,

  }

}



function getLatestVersion(){

  if (
    versions.length === 0
  ){

    return null

  }


  return versions[
    versions.length - 1
  ]

}



function rollbackVersion(id){

  const version =
    versions.find(
      item =>
        item.id === id
    )


  if (!version){

    return {

      success:
        false,

      reason:
        "Version not found.",

    }

  }


  return {

    success:
      true,

    rollbackTarget:
      version,

    message:
      "Personality rollback proposal created.",

  }

}



export {

  MODULE_ID,

  createVersion,

  getVersions,

  getLatestVersion,

  rollbackVersion,

}
