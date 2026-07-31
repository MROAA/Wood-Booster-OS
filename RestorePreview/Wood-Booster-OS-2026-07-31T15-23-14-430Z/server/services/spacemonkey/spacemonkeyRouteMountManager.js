/*
=====================================

SPACEMONKEY ROUTE MOUNT MANAGER

Hallitsee route mountteja.

Yhdistää:

- Mount Registry

Ei käynnistä Expressiä.

=====================================
*/


import {

  getSpacemonkeyMounts

} from "./spacemonkeyRouteMountRegistry.js"







function getSpacemonkeyRouteMountStatus(){


  const mounts =

    getSpacemonkeyMounts()







  return {


    success:true,


    system:

      "Spacemonkey Route Mount Manager",


    version:

      "1.0.0",


    mounts,


    count:

      mounts.length,


    status:

      "active",


    createdAt:

      new Date().toISOString()


  }


}







export {

  getSpacemonkeyRouteMountStatus

}
