function normalizeSection(
  value,
  fallback = ""
) {

  if(
    !value
  ){

    return fallback

  }


  if(
    typeof value === "string"
  ){

    return value

  }


  return JSON.stringify(
    value,
    null,
    2
  )

}





function createContextSection({
  title,
  content
}) {


  return `

## ${title}

${normalizeSection(content)}

`

}







function buildLLMContext({

  system = "",

  identity = "",

  security = "",

  memory = "",

  knowledge = "",

  task = "",

  userMessage = ""

}) {


  const sections = []



  sections.push(

    createContextSection({

      title:
        "SYSTEM RULES",

      content:
        system

    })

  )




  sections.push(

    createContextSection({

      title:
        "SPACEMONKEY IDENTITY",

      content:
        identity

    })

  )




  sections.push(

    createContextSection({

      title:
        "SECURITY",

      content:
        security

    })

  )




  sections.push(

    createContextSection({

      title:
        "MEMORY",

      content:
        memory

    })

  )




  sections.push(

    createContextSection({

      title:
        "KNOWLEDGE",

      content:
        knowledge

    })

  )




  sections.push(

    createContextSection({

      title:
        "CURRENT TASK",

      content:
        task

    })

  )




  sections.push(

    createContextSection({

      title:
        "USER MESSAGE",

      content:
        userMessage

    })

  )




  return sections.join(
    "\n"
  )


}







function createContextSummary(context){


  return {

    characters:
      context.length,

    sections:
      context
        .split("##")
        .filter(Boolean)
        .length

  }


}







export {

  buildLLMContext,

  createContextSummary

}
