/*
=====================================

SPACEMONKEY EXTERNAL API CATALOG ADAPTER

Turvallinen lukuväylä
ulkoiselle API-katalogille.

Read-only.

=====================================
*/


import {

  createSpacemonkeyExternalApiCatalog

} from "./spacemonkeyExternalApiCatalog.js"







function getSpacemonkeyExternalApiCatalog(){


  const catalog =

    createSpacemonkeyExternalApiCatalog()







  return {


    success:true,


    system:

      "Spacemonkey External API Catalog API",


    version:

      "1.0.0",


    catalog


  }


}







export {

  getSpacemonkeyExternalApiCatalog

}
