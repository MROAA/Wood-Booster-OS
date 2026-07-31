/*
=====================================

SPACEMONKEY BOOTSTRAP MANAGER

Hallinnoi Bootstrap Registryä.

Ei käynnistä Expressiä.

Ei suorita moduuleita.

Vain hallittu tila.

=====================================
*/


import {

  getSpacemonkeyComponents

} from "./spacemonkeyBootstrapRegistry.js"







function getSpacemonkeyBootstrapStatus(){


  const components =

    getSpacemonkeyComponents()







  return {


    success:true,


    system:

      "Spacemonkey Bootstrap Manager",


    version:

      "1.0.0",


    components,


    count:

      components.length,


    status:

      "active",


    createdAt:

      new Date().toISOString()


  }


}







export {

  getSpacemonkeyBootstrapStatus

}
