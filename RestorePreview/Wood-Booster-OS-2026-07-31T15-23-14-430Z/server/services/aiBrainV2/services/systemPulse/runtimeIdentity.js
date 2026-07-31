/*
=====================================

WOOD-BOOSTER AI BRAIN V2

RUNTIME IDENTITY

Vastuut:

- tunnistaa käyttöympäristön
- lukee Linux-jakelun tiedot
- kertoo kernel-version
- antaa Spacemonkeylle ympäristötietoisuuden

Ei:
- muuta järjestelmää
- suorita komentoja
- tee päätöksiä

=====================================
*/


import fs from "fs"
import os from "os"





function readOsRelease(){

  try {

    const content =
      fs.readFileSync(
        "/etc/os-release",
        "utf-8",
      )


    const data = {}


    for(
      const line
      of content.split("\n")
    ){

      const parts =
        line.split("=")


      if(
        parts.length !== 2
      ){
        continue
      }


      const key =
        parts[0]


      const value =
        parts[1]
          .replaceAll(
            '"',
            "",
          )


      data[key] =
        value

    }


    return data


  } catch {

    return {}

  }

}





function getRuntimeIdentity(){

  const osRelease =
    readOsRelease()



  return {

    operatingSystem: {

      platform:
        os.platform(),


      distribution:
        osRelease.NAME ||
        "unknown",


      version:
        osRelease.VERSION ||
        "unknown",


      id:
        osRelease.ID ||
        "unknown",

    },


    kernel:
      os.release(),


    architecture:
      os.arch(),


    hostname:
      os.hostname(),


    checkedAt:
      new Date()
        .toISOString(),

  }

}





export {

  getRuntimeIdentity,

}
