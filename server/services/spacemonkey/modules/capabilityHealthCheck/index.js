const MODULE_ID = "capability-health-check"



const capabilities = [

  {
    id: "python",
    name: "Python Capability",
    status: "available",
  },


  {
    id: "javascript",
    name: "JavaScript Capability",
    status: "available",
  },


  {
    id: "nodejs",
    name: "Node.js Capability",
    status: "available",
  },


  {
    id: "react",
    name: "React Capability",
    status: "available",
  },


  {
    id: "linux",
    name: "Linux Capability",
    status: "available",
  },


  {
    id: "docker",
    name: "Docker Capability",
    status: "available",
  },

]



function createCapabilityHealthReport(){

  return {

    moduleId: MODULE_ID,

    timestamp:
      new Date().toISOString(),

    total:

      capabilities.length,


    available:

      capabilities.filter(
        capability =>
          capability.status === "available"
      ).length,


    capabilities,

  }

}



function getCapabilityStatus(id){

  return capabilities.find(
    capability =>
      capability.id === id
  ) || null

}



export {

  MODULE_ID,

  createCapabilityHealthReport,

  getCapabilityStatus,

}
