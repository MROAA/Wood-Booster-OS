const attentionHistory = []


const ATTENTION_STATUS = {


  FOCUSED:
    "focused",


  WAITING:
    "waiting",


  INTERRUPTED:
    "interrupted",


  COMPLETED:
    "completed"

}



function calculateAttentionScore({

  priority = 0,

  relevance = 0,

  contextImportance = 0,

  distraction = 0

}) {


  const score =

    (

      priority * 0.4 +

      relevance * 0.3 +

      contextImportance * 0.3

    )

    -

    (

      distraction * 0.3

    )



  return Math.max(

    0,

    Math.min(

      score,

      1

    )

  )

}



function createFocus({

  goal,

  task,

  priority = 0.5,

  relevance = 0.5,

  contextImportance = 0.5,

  distraction = 0.0

}) {


  const score =

    calculateAttentionScore({

      priority,

      relevance,

      contextImportance,

      distraction

    })



  const focus = {


    id:
      `focus-${Date.now()}`,


    goal,


    task,


    score,


    status:

      score >= 0.5

        ?

        ATTENTION_STATUS.FOCUSED

        :

        ATTENTION_STATUS.WAITING,


    createdAt:
      new Date().toISOString()

  }



  attentionHistory.push(

    focus

  )



  return focus

}



function selectFocus({

  options

}) {


  return options

    .map(

      option =>

        createFocus(option)

    )

    .sort(

      (a,b)=>

        b.score -

        a.score

    )[0]

}



function interruptFocus({

  focusId

}) {


  const focus =

    attentionHistory.find(

      item =>

        item.id === focusId

    )



  if(!focus){

    return null

  }



  focus.status =

    ATTENTION_STATUS.INTERRUPTED



  return focus

}



function completeFocus({

  focusId

}) {


  const focus =

    attentionHistory.find(

      item =>

        item.id === focusId

    )



  if(!focus){

    return null

  }



  focus.status =

    ATTENTION_STATUS.COMPLETED



  return focus

}



function getAttentionStatus(){

  return {


    engine:
      "Spacemonkey Attention Engine",


    version:
      "0.1.0",


    activeFocus:

      attentionHistory.at(-1) || null,


    history:

      attentionHistory.length

  }

}



export {

  ATTENTION_STATUS,

  createFocus,

  selectFocus,

  interruptFocus,

  completeFocus,

  getAttentionStatus

}
