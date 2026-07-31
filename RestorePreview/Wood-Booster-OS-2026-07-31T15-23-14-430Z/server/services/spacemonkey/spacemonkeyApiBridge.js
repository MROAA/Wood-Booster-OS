/*
=====================================

SPACEMONKEY API BRIDGE

Yhdistää Spacemonkey API:t
Express-järjestelmään.

Ei sisällä liiketoimintalogiikkaa.

=====================================
*/


import {

  loadSpacemonkeyApis

} from "./spacemonkeyApiLoader.js"







function getSpacemonkeyApiStatus(){


  return loadSpacemonkeyApis()


}







export {

  getSpacemonkeyApiStatus

}
