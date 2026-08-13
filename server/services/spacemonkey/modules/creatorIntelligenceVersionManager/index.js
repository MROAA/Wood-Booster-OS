const MODULE_ID = "creator-intelligence-version-manager"



const versions = []



function createVersion({

  knowledgeId,

  content,

  reason,

  createdBy,

}){

  const version = {

    id:
      `knowledge-version-${Date.now()}`,

    knowledgeId,

    version:
      generateVersionNumber(
        knowledgeId
      ),

    content,

    reason,

    createdBy,

    created:
      new Date().toISOString(),

    status:
      "draft",

  }


  versions.push(version)


  return version

}



function generateVersionNumber(knowledgeId){

  const existing =
    versions.filter(
      item =>
        item.knowledgeId === knowledgeId
    )


  return `1.${existing.length}.0`

}



function approveVersion(id){

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



  version.status =
    "approved"


  version.approvedAt =
    new Date().toISOString()


  return {

    success:
      true,

    version,

  }

}



function rollbackVersion(knowledgeId){

  const history =
    versions.filter(
      item =>
        item.knowledgeId === knowledgeId
        &&
        item.status === "approved"
    )


  if (
    history.length < 2
  ){

    return {

      success:
        false,

      reason:
        "No previous version available.",

    }

  }


  return {

    success:
      true,

    rollbackTo:
      history[
        history.length - 2
      ],

  }

}



function getVersionHistory(knowledgeId){

  return versions.filter(
    item =>
      item.knowledgeId === knowledgeId
  )

}



function getAllVersions(){

  return {

    moduleId:
      MODULE_ID,

    count:
      versions.length,

    versions,

  }

}



export {

  MODULE_ID,

  createVersion,

  approveVersion,

  rollbackVersion,

  getVersionHistory,

  getAllVersions,

}
