import spacemonkeyPersona from "./spacemonkeyPersona.js"





function createSpacemonkeyContext(){


  return {


    name:
      "SPACEMONKEY_PERSONA",



    content:

      JSON.stringify(

        spacemonkeyPersona,

        null,

        2

      ),



  }


}







export {

  createSpacemonkeyContext,

}







export default createSpacemonkeyContext
