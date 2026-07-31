const SPACEMONKEY_STATES = {

  IDLE:
    "idle",

  UNDERSTANDING:
    "understanding",

  REASONING:
    "reasoning",

  DECISION:
    "decision",

  PLANNING:
    "planning",

  EXECUTING:
    "executing",

  VERIFYING:
    "verifying",

  REFLECTING:
    "reflecting",

  LEARNING:
    "learning",

  SAFE_MODE:
    "safe_mode"

}



let currentState = {

  state:
    SPACEMONKEY_STATES.IDLE,

  startedAt:
    new Date().toISOString(),

  activity:
    null

}



function setSpacemonkeyState({

  state,

  activity = null

}) {


  if(
    !Object.values(
      SPACEMONKEY_STATES
    ).includes(state)
  ){

    throw new Error(
      `Invalid Spacemonkey state: ${state}`
    )

  }



  currentState = {


    state,


    activity,


    changedAt:
      new Date().toISOString()


  }



  return currentState

}



function getSpacemonkeyState(){


  return {

    ...currentState

  }

}



function isState(expectedState){


  return (
    currentState.state === expectedState
  )

}



function resetSpacemonkeyState(){


  currentState = {


    state:
      SPACEMONKEY_STATES.IDLE,


    activity:
      null,


    changedAt:
      new Date().toISOString()

  }



  return currentState

}



function getAvailableStates(){


  return Object.values(
    SPACEMONKEY_STATES
  )

}



export {

  SPACEMONKEY_STATES,

  setSpacemonkeyState,

  getSpacemonkeyState,

  isState,

  resetSpacemonkeyState,

  getAvailableStates

}
