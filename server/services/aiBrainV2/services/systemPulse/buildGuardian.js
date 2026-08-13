/*
WOOD-BOOSTER HQ

SYSTEM PULSE

BUILD GUARDIAN

Vastuut:

- hallitsee vakaiden buildien rekisteröintiä
- estää turhat snapshotit
- tarjoaa viimeisen vakaan buildin tiedon

Ei:

- suorita npm buildia itse
- muuta lähdekoodia
- palauta järjestelmää
*/


import {
  addStableBuild,
  getLatestStableBuild,
} from "./stableBuildRegistry.js"



export async function registerStableBuild(
{
  version,
  commit,
  snapshot,
}
){


const latest =
  await getLatestStableBuild()



if(
latest &&
latest.version === version &&
latest.commit === commit
){

return {

  success:true,

  status:
    "already_registered",


  build:
    latest,

}

}



const build = {

version:
  version || "unknown",


commit:
  commit || "unknown",


snapshot:
  snapshot || null,


status:
  "stable",

}



const registry =
await addStableBuild(
  build,
)



return {

success:true,

status:
  "registered",


build,


totalStableBuilds:
  registry.stableBuilds.length,

}

}



export async function getStableBuildStatus(){

const latest =
await getLatestStableBuild()



return {

status:
  latest
    ? "stable"
    : "unknown",


latestStableBuild:
  latest,


available:
  Boolean(latest),


checkedAt:
  new Date()
    .toISOString(),

}

}
