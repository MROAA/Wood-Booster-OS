function createPipelineStep({
  name,
  handler
}) {

  return {

    name,

    handler

  }

}





async function executeStep(
  step,
  context
) {


  try {

    const result =
      await step.handler(
        context
      )


    return {

      success:true,

      result

    }


  }

  catch(error){


    return {

      success:false,

      error:
        error.message

    }


  }

}







async function runResponsePipeline({

  response,

  steps = []

}) {


  let pipelineContext = {

    response,

    metadata:{}

  }




  for(
    const step
    of steps
  ){

    const result =
      await executeStep(
        step,
        pipelineContext
      )



    if(
      !result.success
    ){

      return {

        success:false,

        blocked:true,

        step:
          step.name,

        error:
          result.error

      }

    }



    pipelineContext = {

      ...pipelineContext,

      ...result.result

    }


  }



  return {

    success:true,

    blocked:false,

    response:
      pipelineContext.response,

    metadata:
      pipelineContext.metadata

  }


}







function createDefaultPipeline(){

  return [

    createPipelineStep({

      name:
        "basic_validation",

      handler:
        async(context)=>{


          if(
            !context.response
          ){

            throw new Error(
              "Empty AI response"
            )

          }


          return {

            metadata:{

              validated:true

            }

          }

        }

    })

  ]

}







export {

  createPipelineStep,

  runResponsePipeline,

  createDefaultPipeline

}
