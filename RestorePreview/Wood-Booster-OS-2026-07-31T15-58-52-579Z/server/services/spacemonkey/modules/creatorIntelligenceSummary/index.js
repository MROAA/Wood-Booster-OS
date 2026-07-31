const MODULE_ID = "creator-intelligence-summary"



const summaries = []



function createCreatorSummary({

  identity,

  philosophy,

  decisions,

  journal,

  knowledge,

  patterns,

}){

  const summary = {

    id:
      `creator-summary-${Date.now()}`,

    timestamp:
      new Date().toISOString(),


    creator:

      {
        identity:
          identity || null,

        philosophy:
          philosophy || [],

      },


    development:

      {
        decisions:
          decisions || [],

        journal:
          journal || [],

      },


    knowledge:

      {
        entries:
          knowledge || [],

      },


    patterns:
      patterns || [],



    status:
      "generated",

  }


  summaries.push(summary)


  return summary

}



function getCreatorSummaries(){

  return {

    moduleId:
      MODULE_ID,

    timestamp:
      new Date().toISOString(),

    count:
      summaries.length,

    summaries,

  }

}



function getLatestSummary(){

  if (
    summaries.length === 0
  ){

    return null

  }


  return summaries[
    summaries.length - 1
  ]

}



function extractCorePrinciples(summary){

  if (!summary){

    return []

  }


  return [

    ...(summary.creator.philosophy || []),

    ...(summary.patterns || []),

  ]

}



export {

  MODULE_ID,

  createCreatorSummary,

  getCreatorSummaries,

  getLatestSummary,

  extractCorePrinciples,

}
