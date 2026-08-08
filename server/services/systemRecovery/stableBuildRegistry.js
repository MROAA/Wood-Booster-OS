/*
WOOD-BOOSTER HQ

STABLE BUILD REGISTRY

Vastuut:

- tallentaa viimeisen vakaan buildin
- yhdistää snapshotin kehitysversioon
- tarjoaa System Pulse -tilan

Ei:

- suorita buildia
- palauta järjestelmää
- muuta lähdekoodia
*/


import fs from "fs"
import path from "path"
import {
fileURLToPath
} from "url"



const __filename =
fileURLToPath(
import.meta.url
)


const __dirname =
path.dirname(
__filename
)



const STORE =
path.join(
__dirname,
"stableBuildStore.json"
)



function readStore(){

if(
!fs.existsSync(
STORE
)
){

fs.writeFileSync(
STORE,
"{}"
)

}


return JSON.parse(
fs.readFileSync(
STORE,
"utf-8"
)
)

}



function saveStore(
data
){

fs.writeFileSync(
STORE,
JSON.stringify(
data,
null,
2
)
)

}



export function registerStableBuild(
{
version="unknown",
commit="unknown",
snapshot=null,
}={}
){

const build = {

id:
Date.now(),


version,


commit,


snapshot,


status:
"stable",


createdAt:
new Date()
.toISOString()

}



saveStore(
build
)


return build

}



export function getStableBuild(){

return readStore()

}
