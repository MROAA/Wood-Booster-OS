/*
=====================================

SPACEMONKEY MODULE LIFECYCLE

Hallinnoi moduulien turvallisia
tilasiirtymiä.

Ei suorita moduuleja.

=====================================
*/


const transitions = {


  created: [

    "loaded"

  ],


  loaded: [

    "active"

  ],


  active: [

    "disabled"

  ],


  disabled: [

    "recovery"

  ],


  recovery: [

    "loaded"

  ]

}







function canTransition(

  from,

  to

){


  const allowed =

    transitions[from] || []





  return allowed.includes(

    to

  )


}







function transitionModuleState(

  runtime,

  nextState

){


  if(!runtime){


    return {


      success:false,


      error:"Runtime missing"


    }

  }







  const allowed =

    canTransition(

      runtime.state,

      nextState

    )







  if(!allowed){


    return {


      success:false,


      error:

        `Invalid transition ${runtime.state} -> ${nextState}`


    }


  }







  return {


    success:true,


    runtime:{


      ...runtime,


      state:

        nextState,


      updatedAt:

        new Date().toISOString()


    }


  }


}







export {

  canTransition,

  transitionModuleState

}
