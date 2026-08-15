import {
  generateCodeChange,
} from "./spacemonkeyCodeGenerator.js"


import {
  evaluateCodeChangeApproval,
} from "./spacemonkeyChangeApproval.js"


import {
  validateCodeProposal,
} from "./spacemonkeyCodeValidationEngine.js"


import {
  createCodeTestPlan,
} from "./spacemonkeyCodeTestEngine.js"


import {
  simulateCodeExecution,
} from "./spacemonkeyCodeExecutionSimulator.js"


import {
  evaluateCodeQuality,
} from "./spacemonkeyCodeQualityEngine.js"


import {
  evaluateReleaseGate,
} from "./spacemonkeyCodeReleaseGateEngine.js"


import {
  prepareCodeWrite,
} from "./spacemonkeyCodeWriter.js"


import {
  executeCodeChange,
} from "./spacemonkeyExecutionController.js"


import {
  recordActivity,
} from "./spacemonkeyActivityFeedEngine.js"



const pipelineHistory = []





async function runCodePipeline({

  prisma,

  codingContext,

  codeUnderstanding,

  codeChangePlan,

  sourceCode,

  instruction

}) {


  const codeGeneration =

    generateCodeChange({

      filePath:
        codingContext?.filePath,

      sourceCode,

      changePlan:
        codeChangePlan,

      instruction

    })





  await recordActivity({

    prisma,

    type:
      "code_generation_completed",

    module:
      "Code Generator",

    status:
      "completed",

    message:
      `Code proposal generated for ${codingContext?.filePath || "unknown file"}`

  })







  const changeApproval =

    await evaluateCodeChangeApproval({

      prisma,

      changePlan:
        {

          ...codeChangePlan,

          filePath:
            codingContext?.filePath,

          instruction

        }

    })







  await recordActivity({

    prisma,

    type:
      "approval_requested",

    module:
      "Change Approval",

    status:
      "waiting",

    message:
      "Code change requires user approval.",

    metadata:
      changeApproval

  })








  const codeValidation =

    await validateCodeProposal({

      prisma,

      proposal:
        codeGeneration,

      codeInspection:
      {

        exists:
          Boolean(sourceCode)

      },

      changeApproval

    })








  const codeTestPlan =

    await createCodeTestPlan({

      prisma,

      filePath:
        codingContext?.filePath,

      codeUnderstanding,

      proposal:
        codeGeneration

    })








  const executionSimulation =

    await simulateCodeExecution({

      prisma,

      filePath:
        codingContext?.filePath,

      proposal:
        codeGeneration,

      validation:
        codeValidation,

      testPlan:
        codeTestPlan

    })








  const codeQuality =

    await evaluateCodeQuality({

      validation:
        codeValidation,

      testPlan:
        codeTestPlan,

      approval:
        changeApproval,

      risk:
        codeValidation.risk

    })








  await recordActivity({

    prisma,

    type:
      "code_quality_evaluated",

    module:
      "Code Quality Engine",

    status:
      codeQuality.status,

    message:
      `Code quality score: ${codeQuality.score}/100`

  })








  const releaseGate =

    await evaluateReleaseGate({

      prisma,

      quality:
        codeQuality,

      validation:
        codeValidation,

      testPlan:
        codeTestPlan,

      approval:
        changeApproval

    })








  const codeWrite =

    prepareCodeWrite({

      filePath:
        codingContext?.filePath,

      newContent:
        codeGeneration,

      approval:
        changeApproval

    })








  await recordActivity({

    prisma,

    type:
      "code_write_prepared",

    module:
      "Code Writer",

    status:
      codeWrite.status,

    message:
      `Code write prepared for ${codingContext?.filePath || "unknown file"}`

  })








  let executionResult = null



  if(
    changeApproval.approved === true &&
    releaseGate.approvedForRelease === true
  ){

    executionResult =

      await executeCodeChange({

        filePath:
          codingContext?.filePath,

        content:
          codeGeneration,

        approval:
          changeApproval

      })

  }








  const result = {


    status:
      "completed",


    target:
      codingContext?.target || null,


    filePath:
      codingContext?.filePath || null,


    codeGeneration,


    changeApproval,


    codeValidation,


    codeTestPlan,


    executionSimulation,


    codeQuality,


    releaseGate,


    codeWrite,


    executionResult,


    nextStep:

      executionResult

        ? "completed"

        : releaseGate.nextStep,


    createdAt:
      new Date().toISOString()

  }







  pipelineHistory.push(result)



  return result

}







function getCodePipelineStatus(){


  return {

    engine:
      "Spacemonkey Code Pipeline",

    version:
      "1.0.0",

    pipelines:
      pipelineHistory.length

  }

}







export {

  runCodePipeline,

  getCodePipelineStatus

}
