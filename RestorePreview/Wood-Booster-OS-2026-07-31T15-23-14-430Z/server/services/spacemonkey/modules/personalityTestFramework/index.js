const MODULE_ID = "personality-test-framework"



const tests = []



function createTest({

  id,

  category,

  description,

  check,

}){

  const test = {

    id,

    category,

    description,

    check,

    status:
      "registered",

  }


  tests.push(test)


  return test

}



function runTest(test){

  let result = false


  try {

    result =
      test.check()

  }

  catch(error){

    result =
      false

  }



  return {

    id:
      test.id,

    category:
      test.category,

    description:
      test.description,

    passed:
      Boolean(result),

    status:
      result
        ? "passed"
        : "failed",

  }

}



function runAllTests(){

  return {

    moduleId:
      MODULE_ID,

    timestamp:
      new Date().toISOString(),

    total:
      tests.length,

    results:
      tests.map(
        test =>
          runTest(test)
      ),

  }

}



function getRegisteredTests(){

  return {

    moduleId:
      MODULE_ID,

    count:
      tests.length,

    tests,

  }

}



export {

  MODULE_ID,

  createTest,

  runTest,

  runAllTests,

  getRegisteredTests,

}
