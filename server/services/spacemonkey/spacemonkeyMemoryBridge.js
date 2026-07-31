/*
=====================================

SPACEMONKEY MEMORY BRIDGE V3


Event Bus -> Memory Proposal bridge


Vastuut:

- vastaanottaa Spacemonkey tapahtumia
- muodostaa muistiehdotuksia
- toimii Event Integration yhteensopivuuskerroksena


Ei:

- ei kirjoita tietokantaan
- ei hyväksy muistia
- ei muuta AI Brainia


=====================================
*/



let started = false







function createMemoryProposalFromEvent(
  event = {},
){

  const eventName =

    event.name ||

    event.event ||

    "UNKNOWN_EVENT"



  return {


    title:

      `Spacemonkey Event: ${eventName}`,



    content:

      JSON.stringify(

        {

          event:
            eventName,


          payload:
            event.payload || {},


          timestamp:

            event.timestamp ||

            new Date()
              .toISOString(),

        },

        null,

        2

      ),



    source:

      "spacemonkey-event",



    importance:

      calculateImportance(
        eventName
      ),


  }


}







function calculateImportance(
  eventName = "",
){


  const name =

    String(
      eventName
    )
    .toUpperCase()





  if(

    name.includes(
      "SECURITY"
    )

  ){

    return 10

  }





  if(

    name.includes(
      "ERROR"
    )

  ){

    return 9

  }





  if(

    name.includes(
      "COMMAND"
    )

  ){

    return 5

  }





  if(

    name.includes(
      "SYSTEM"
    )

  ){

    return 7

  }





  return 3


}







function handleMemoryEvent(
  event = {},
){


  const proposal =

    createMemoryProposalFromEvent(
      event
    )



  console.log(
    "MEMORY PROPOSAL CREATED:",
    proposal
  )



  return proposal


}







function startSpacemonkeyMemoryBridge(){


  if(started){

    return {

      success:
        true,


      status:
        "already_started",

    }

  }



  started = true



  console.log(
    "SPACEMONKEY MEMORY BRIDGE ONLINE"
  )



  return {

    success:
      true,


    status:
      "started",

  }


}







function getSpacemonkeyMemoryBridgeStatus(){


  return {

    system:
      "Spacemonkey Memory Bridge",


    version:
      "3.0.0",


    started,


    status:
      started
        ? "ACTIVE"
        : "READY",

  }


}







export {

  startSpacemonkeyMemoryBridge,

  getSpacemonkeyMemoryBridgeStatus,

  createMemoryProposalFromEvent,

  handleMemoryEvent,

}
