function normalizeKnowledge(value){

  if(
    !value
  ){

    return ""

  }


  if(
    typeof value === "string"
  ){

    return value.trim()

  }


  return JSON.stringify(
    value,
    null,
    2
  )

}







function validateKnowledge({

  source = "unknown",

  content,

  confidence = 0,

  verified = false,

  metadata = {}

}) {


  const normalized =
    normalizeKnowledge(
      content
    )



  const issues = []



  if(
    !normalized
  ){

    issues.push(
      "Knowledge content empty"
    )

  }



  if(
    confidence < 0 ||
    confidence > 1
  ){

    issues.push(
      "Invalid confidence value"
    )

  }




  return {

    valid:
      issues.length === 0,


    status:
      verified
        ? "VERIFIED"
        : "UNVERIFIED",


    source,


    confidence,


    content:
      normalized,


    metadata,


    issues

  }


}







function createKnowledgeRecord({

  id,

  category,

  content,

  source = "system",

  confidence = 0.5

}) {


  return {

    id,

    category,

    content,

    source,

    confidence,

    createdAt:
      new Date()
        .toISOString()

  }


}







function filterValidKnowledge(
  items = []
){

  return items.filter(
    item => {

      const result =
        validateKnowledge(
          item
        )


      return result.valid

    }
  )

}







export {

  validateKnowledge,

  createKnowledgeRecord,

  filterValidKnowledge

}
