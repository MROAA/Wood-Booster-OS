import {

  getLanguageCore

} from "./services/spacemonkey/core/languageCore.js"





const language =

  getLanguageCore()





console.log(

  JSON.stringify(

    language,

    null,

    2

  )

)
