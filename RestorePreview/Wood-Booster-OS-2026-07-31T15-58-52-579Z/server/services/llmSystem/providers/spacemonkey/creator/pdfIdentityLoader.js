/*
=====================================
WOOD-BOOSTER AI PLATFORM

PDF IDENTITY LOADER V4.1

Creator Identity Source:

Wood-Booster-OS/Spacemonkey/PERSONAL/
GODFILE_MARCJÄRVINEN.pdf

=====================================
*/


import fs from "fs/promises"
import path from "path"
import { createRequire } from "module"





const require =
  createRequire(
    import.meta.url
  )


const pdfModule =
  require(
    "pdf-parse"
  )


const PDFParse =
  pdfModule.PDFParse ||
  pdfModule.default ||
  pdfModule





const PROJECT_ROOT =
  path.resolve(
    process.cwd()
  )



const PDF_PATH =
  path.join(
    PROJECT_ROOT,
    "Spacemonkey",
    "PERSONAL",
    "GODFILE_MARCJÄRVINEN.pdf"
  )







async function loadCreatorPDF(){


  try {


    const buffer =
      await fs.readFile(
        PDF_PATH
      )



    const parser =
      new PDFParse(
        {
          data: buffer
        }
      )



    const result =
      await parser.getText()



    await parser.destroy()



    return {

      loaded:
        true,


      source:
        "GODFILE_MARCJÄRVINEN.pdf",


      type:
        "primary_identity_source",


      path:
        PDF_PATH,


      pages:
        result.pages?.length ||
        null,


      characters:
        result.text.length,


      content:
        result.text

    }


  }


  catch(error){


    return {

      loaded:
        false,


      source:
        "GODFILE_MARCJÄRVINEN.pdf",


      path:
        PDF_PATH,


      error:
        error.message

    }


  }


}







function createCreatorIdentityContext(
  document
){


  if(
    !document ||
    !document.loaded
  ){

    return ""

  }



  return [

    "SOURCE: GODFILE_MARCJÄRVINEN.pdf",

    "TYPE: PRIMARY_IDENTITY_SOURCE",

    document.content

  ].join("\n\n")


}







export {

  loadCreatorPDF,

  createCreatorIdentityContext

}
