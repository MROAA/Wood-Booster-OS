import {
  readFile,
  writeFile,
} from "fs/promises"



const ACTIVITY_PATH =
  "/home/marc/Wood-Booster-AI/Wood-Booster-OS/server/data/systemActivity.json"





async function readActivity(){


  try{


    const data =
      await readFile(
        ACTIVITY_PATH,
        "utf-8"
      )



    return JSON.parse(
      data
    )


  }
  catch(error){


    return {

      events:[]

    }


  }


}







async function saveActivity(activity){


  await writeFile(

    ACTIVITY_PATH,

    JSON.stringify(
      activity,
      null,
      2
    )

  )


}







export async function addSystemActivity(event){


  const activity =
    await readActivity()



  activity.events.unshift(

    {

      id:
        Date.now(),

      time:
        new Date()
          .toISOString(),

      ...event

    }

  )



  await saveActivity(
    activity
  )



  return activity

}







export async function getSystemActivity(){


  const activity =
    await readActivity()



  return activity.events || []

}
