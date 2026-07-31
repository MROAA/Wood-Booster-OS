const allowedCommands = [

  "restart-core",
  "purge-logs",
  "emergency-stop",

]



const blockedPatterns = [

  "rm -rf",
  "delete database",
  "drop table",
  "format disk",
  "shutdown system",

]



const SecurityGuard = {


  validateCommand(command) {


    if (
      typeof command !== "string"
    ) {

      return false

    }



    const normalized =
      command
        .toLowerCase()
        .trim()



    if (
      blockedPatterns.some(
        (pattern) =>
          normalized.includes(pattern)
      )
    ) {

      return false

    }



    return allowedCommands.includes(
      normalized
    )


  },





  sanitizeMessage(message) {


    if (
      typeof message !== "string"
    ) {

      return ""

    }



    return message
      .replace(
        /<script.*?>.*?<\/script>/gi,
        ""
      )
      .replace(
        /<.*?>/g,
        ""
      )
      .trim()


  },





  validateChatInput(message) {


    const clean =
      this.sanitizeMessage(
        message
      )



    if (
      clean.length === 0
    ) {

      return {

        valid:false,

        message:"Tyhjä viesti estetty."

      }

    }



    if (
      clean.length > 2000
    ) {

      return {

        valid:false,

        message:"Viesti liian pitkä."

      }

    }



    return {

      valid:true,

      message:clean

    }


  },


}



export default SecurityGuard