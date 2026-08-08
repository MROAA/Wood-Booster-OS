/*
WOOD-BOOSTER HQ

SPACEMONKEY

ARCHITECTURE AUDIT MODULE
*/


import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"



const __filename =
fileURLToPath(
import.meta.url
)



const __dirname =
path.dirname(
__filename
)



function getModulesRoot(){

return path.resolve(
__dirname,
".."
)

}



function scanModules(){

const root =
getModulesRoot()



if(
!fs.existsSync(root)
){

return []

}



return fs.readdirSync(
root,
{
withFileTypes:true
}
)

.filter(
item =>
item.isDirectory()
)

.filter(
item =>
item.name !== "architectureAudit"
)

.map(
item=>{


const modulePath =
path.join(
root,
item.name
)



const files =
fs.readdirSync(
modulePath
)



return {

name:
item.name,

path:
modulePath,

hasIndex:
files.includes(
"index.js"
),

hasTest:
files.some(
file =>
file.includes("test")
),

files:
files.length

}


}

)

}



function getArchitectureAudit(){


const modules =
scanModules()



const total =
modules.length



const healthy =
modules.filter(
module =>
module.hasIndex
)
.length



const withTests =
modules.filter(
module =>
module.hasTest
)
.length



const missingIndex =
modules.filter(
module =>
!module.hasIndex
)
.map(
module =>
module.name
)



const score =

total === 0

?

0

:

Math.round(
(
healthy /
total
)
*
100
)



return {

system:
"Spacemonkey Architecture Audit",

status:

score >= 90
?
"healthy"
:
"warning",

score,

modules:{
total,
healthy,
withTests
},

missingIndex,

audit:
modules,

checkedAt:
new Date()
.toISOString()

}

}



export {

getArchitectureAudit

}
