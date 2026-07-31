/*
=====================================

SPACEMONKEY API CATALOG ADAPTER

Turvallinen lukuväylä
Spacemonkey API Catalogille.

Read-only.

Ei muuta järjestelmää.

=====================================
*/


import {

  createSpacemonkeyApiCatalog

} from "./spacemonkeyApiCatalog.js"







function getSpacemonkeyApiCatalog(){


  const catalog =

    createSpacemonkeyApiCatalog()







  return {


    success:true,


    system:

      "Spacemonkey API Catalog API",


    version:

      "1.0.0",


    catalog


  }


}







export {

  getSpacemonkeyApiCatalog

}
