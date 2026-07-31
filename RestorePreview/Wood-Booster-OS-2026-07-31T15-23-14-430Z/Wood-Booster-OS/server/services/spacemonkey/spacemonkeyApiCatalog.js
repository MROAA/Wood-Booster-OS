/*
=====================================

SPACEMONKEY API CATALOG

Kuvaa käytettävissä olevat
Spacemonkey API:t.

Read-only.

=====================================
*/



function createSpacemonkeyApiCatalog(){


  return {


    system:

      "Spacemonkey API Catalog",


    version:

      "1.0.0",


    apis:


      [

        {

          id:

            "kernel",


          path:

            "/spacemonkey/kernel",


          version:

            "1.0.0",


          status:

            "active"

        },


        {

          id:

            "system",


          path:

            "/spacemonkey/system",


          version:

            "1.0.0",


          status:

            "active"

        },


        {

          id:

            "snapshot-v3",


          path:

            "/spacemonkey/snapshot-v3",


          version:

            "3.0.0",


          status:

            "active"

        },


        {

          id:

            "modules",


          path:

            "/spacemonkey/modules",


          version:

            "1.0.0",


          status:

            "active"

        }

      ],


    createdAt:

      new Date().toISOString()


  }


}







export {

  createSpacemonkeyApiCatalog

}
