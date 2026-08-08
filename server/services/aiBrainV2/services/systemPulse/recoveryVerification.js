/*
WOOD-BOOSTER HQ

SYSTEM PULSE RECOVERY VERIFICATION

Vastuut:

- tarkistaa palautuksen onnistuminen
- varmistaa System Pulsen tilan
- palauttaa diagnostiikkaraportin

Ei:

- tee palautuksia
- muuta järjestelmää
- käynnistä palveluita
*/


import {
  getSystemPulse,
} from "./systemPulseService.js"



export async function verifyRecovery(){

  try {

    const pulse =
      await getSystemPulse()



    return {

      success:
        true,


      status:
        pulse.status,


      healthy:
        pulse.healthy,


      diagnostics:
        pulse.diagnostics,


      checkedAt:
        new Date()
          .toISOString(),

    }

  }

  catch(error){

    return {

      success:
        false,


      status:
        "verification_failed",


      error:
        error instanceof Error
          ? error.message
          : String(error),


      checkedAt:
        new Date()
          .toISOString(),

    }

  }

}
