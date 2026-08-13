/*
=====================================

SPACEMONKEY SNAPSHOT ADAPTER V3

Turvallinen lukuväylä
Spacemonkey System Snapshot v3:lle.

Read-only.

Ei muuta järjestelmää.

=====================================
*/


import {

  createSpacemonkeySystemSnapshotV3

} from "./spacemonkeySystemSnapshotV3.js"







async function getSpacemonkeySnapshotV3(){


  const snapshot =

    await createSpacemonkeySystemSnapshotV3()







  return {


    success:true,


    system:

      "Spacemonkey Snapshot API",


    version:

      "3.0.0",


    snapshot


  }


}







export {

  getSpacemonkeySnapshotV3

}
