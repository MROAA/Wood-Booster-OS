/*
=====================================

SPACEMONKEY EXTERNAL API CATALOG

Kuvaa kaikki ulkoiset
Spacemonkey API endpointit.

Read-only.

=====================================
*/



function createSpacemonkeyExternalApiCatalog(){


  return {


    system:

      "Spacemonkey External API Catalog",


    version:

      "1.0.0",


    endpoints:


      [

        {

          id:

            "kernel",


          path:

            "/api/spacemonkey/kernel",


          version:

            "1.0.0",


          status:

            "active"

        },


        {

          id:

            "system",


          path:

            "/api/spacemonkey/system",


          version:

            "1.0.0",


          status:

            "active"

        },


        {

          id:

            "snapshot-v3",


          path:

            "/api/spacemonkey/snapshot-v3",


          version:

            "3.0.0",


          status:

            "active"

        },


        {

          id:

            "modules",


          path:

            "/api/spacemonkey/modules",


          version:

            "1.0.0",


          status:

            "active"

        },


        {

          id:

            "api-catalog",


          path:

            "/api/spacemonkey/api-catalog",


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

  createSpacemonkeyExternalApiCatalog

}
