/*
WOOD-BOOSTER HQ

SYSTEM PULSE

STABLE BUILD REGISTRY

Vastuut:

- tallentaa vakaat buildit
- säilyttää viimeisen toimivan version
- tarjoaa palautuspisteen Build Guardianille

Ei:

- suorita buildia
- tee snapshotteja
- palauta järjestelmää
*/


import {
  readFile,
  writeFile,
  mkdir,
} from "fs/promises"

import path from "path"

import {
  fileURLToPath,
} from "url"



const DATA_DIR =
path.join(
  path.dirname(
    fileURLToPath(import.meta.url),
  ),
  "../../../../data",
)



const REGISTRY_PATH =
path.join(
  DATA_DIR,
  "stableBuildRegistry.json",
)



async function ensureDataDirectory(){

await mkdir(
  DATA_DIR,
  {
    recursive:true,
  },
)

}



async function readRegistry(){

try {

await ensureDataDirectory()


const data =
  await readFile(
    REGISTRY_PATH,
    "utf-8",
  )


return JSON.parse(
  data,
)

}

catch {

return {

  stableBuilds: [],

}

}

}



async function saveRegistry(
registry,
){

await ensureDataDirectory()


await writeFile(

REGISTRY_PATH,

JSON.stringify(
  registry,
  null,
  2,
),

)

}



export async function addStableBuild(
build,
){

const registry =
await readRegistry()


registry.stableBuilds.unshift({

id:
  Date.now(),


...build,


createdAt:
  new Date()
    .toISOString(),

})



registry.stableBuilds =
registry.stableBuilds.slice(
  0,
  20,
)



await saveRegistry(
  registry,
)



return registry

}



export async function getStableBuilds(){

const registry =
await readRegistry()


return (
registry.stableBuilds || []
)

}



export async function getLatestStableBuild(){

const builds =
await getStableBuilds()


return (
builds[0] ||
null
)

}