const mapHistory = []



function createArchitectureMap({

  scanResult

}) {


  const map = {


    frontend: [],


    backend: [],


    other: [],


    createdAt:

      new Date().toISOString()

  }



  if(

    !scanResult ||

    !Array.isArray(scanResult.files)

  ){

    mapHistory.push(map)

    return map

  }



  for(

    const file

    of scanResult.files

  ){


    classifyFile({

      file,

      map

    })

  }



  mapHistory.push(

    map

  )



  return map

}





function classifyFile({

  file,

  map

}) {


  const filePath =

    String(

      file.path || ""

    )

    .toLowerCase()



  if(

    filePath.includes("/src/")

  ){


    map.frontend.push(

      createNode(file)

    )


    return

  }



  if(

    filePath.includes("/server/")

  || filePath.includes("/services/")

  ){


    map.backend.push(

      createNode(file)

    )


    return

  }



  map.other.push(

    createNode(file)

  )

}





function createNode(file){


  return {


    path:

      file.path,


    type:

      file.type || "unknown"

  }

}





function getArchitectureMaps(){


  return [

    ...mapHistory

  ]

}





function getArchitectureMapStatus(){


  return {


    engine:

      "Spacemonkey Architecture Map Engine",


    version:

      "0.1.0",


    maps:

      mapHistory.length

  }

}



export {

  createArchitectureMap,

  getArchitectureMaps,

  getArchitectureMapStatus

}
