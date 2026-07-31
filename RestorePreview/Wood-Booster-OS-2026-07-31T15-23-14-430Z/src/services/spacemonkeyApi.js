const API_URL =
  "http://localhost:3001/api"





export async function runSpacemonkeyCommand(
  command
) {


  const response =
    await fetch(
      `${API_URL}/command`,
      {

        method:"POST",

        headers:{
          "Content-Type":
            "application/json",
        },

        body:JSON.stringify({

          command,

        }),

      }
    )





  const data =
    await response.json()





  if(
    !response.ok
  ){

    throw new Error(
      data.error ||
      "Spacemonkey command failed"
    )

  }





  return data


}







export async function getSpacemonkeyStatus(){


  const response =
    await fetch(
      `${API_URL}/status`
    )




  const data =
    await response.json()




  if(
    !response.ok
  ){

    throw new Error(
      data.error ||
      "Spacemonkey status failed"
    )

  }





  return data


}
