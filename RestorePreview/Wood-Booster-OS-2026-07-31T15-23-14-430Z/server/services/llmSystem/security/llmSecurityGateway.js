const securityRules = new Map()





function registerSecurityRule({

  id,

  name,

  check

}) {


  if(
    !id ||
    !check
  ){

    throw new Error(
      "Invalid security rule"
    )

  }



  securityRules.set(
    id,
    {
      id,
      name,
      check
    }
  )



  return id

}







function getSecurityRules(){


  return Array.from(
    securityRules.values()
  )

}







async function runSecurityChecks(context){


  const results = []



  for(
    const rule
    of securityRules.values()
  ){


    try {


      const result =
        await rule.check(
          context
        )


      results.push({

        rule:
          rule.id,

        passed:
          result !== false,

        result

      })


    }

    catch(error){


      results.push({

        rule:
          rule.id,

        passed:false,

        error:
          error.message

      })


    }


  }



  return results

}







function isSecurityApproved(results){


  return results.every(

    result =>
      result.passed

  )


}







async function authorizeLLMRequest({

  user,

  module,

  action,

  context = {}

}) {


  const securityContext = {

    user,

    module,

    action,

    context,

    timestamp:
      new Date()
        .toISOString()

  }



  const checks =
    await runSecurityChecks(
      securityContext
    )



  return {

    approved:
      isSecurityApproved(
        checks
      ),

    checks,

    context:
      securityContext

  }


}







function createDefaultSecurityRules(){


  return [

    {

      id:
        "request_exists",

      name:
        "Request validation",


      check:
        async(context)=>{

          return Boolean(
            context.action
          )

        }

    },


    {

      id:
        "module_exists",

      name:
        "Module validation",


      check:
        async(context)=>{

          return Boolean(
            context.module
          )

        }

    }


  ]

}







export {

  registerSecurityRule,

  getSecurityRules,

  runSecurityChecks,

  isSecurityApproved,

  authorizeLLMRequest,

  createDefaultSecurityRules

}
