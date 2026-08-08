import {
useEffect,
useState
} from "react"


import {
apiGet,
apiPost,
} from "../api/client"


import PulseCard from "../components/systemPulse/PulseCard"
import InstallerManagerCard from "../components/systemPulse/InstallerManagerCard"
import StatusGlow from "../components/systemPulse/StatusGlow"
import SecurityCard from "../components/systemPulse/SecurityCard"
import InstallerCard from "../components/systemPulse/InstallerCard"



function SystemPulse(){


const [
pulse,
setPulse
] = useState(null)



const [
core,
setCore
] = useState(null)



const [
activities,
setActivities
] = useState([])



const [
connection,
setConnection
] = useState("CHECKING")



const [
lastUpdate,
setLastUpdate
] = useState(null)



const [
,
setPreviousHealth
] = useState(null)



const [
healthChange,
setHealthChange
] = useState(null)



const [
loading,
setLoading
] = useState(true)



const [
error,
setError
] = useState("")



const [
snapshotResult,
setSnapshotResult
] = useState(null)



const [
restoreApprovalResult,
setRestoreApprovalResult
] = useState(null)



async function createSnapshot(){

try {


const result =
await apiPost(
"/system-installer/snapshot/create",
{}
)



setSnapshotResult(
result.snapshot
)



}

catch(error){

console.error(
error
)

}

}



async function requestRestore(){

try {


const result =
await apiPost(
"/system-installer/restore-approval/check",
{
confirmed:false
}
)



setRestoreApprovalResult(
result.approval
)



}

catch(error){

console.error(
error
)


}

}



async function loadSystemData(){

try {


setError("")



const pulseData =
await apiGet(
"/system-pulse"
)



if(
pulseData.success
){

const summary =
pulseData.pulse.summary



const currentHealth =
summary.healthScore



setPreviousHealth(
previous => {


if(previous){

setHealthChange({

from:
previous.score,


to:
currentHealth.score,


difference:
currentHealth.score -
previous.score

})

}


return currentHealth


}

)



setPulse({

...pulseData.pulse,


brain: {

modules:
summary.modules.total,


activeModules:
summary.modules.active

},



security: {

capabilitiesApproved:
summary.capability.approved,


blocked:
summary.security.blockedEvents,


approvalRequired:
summary.security.approvalRequired,


status:
summary.security.status,


message:
summary.security.message

},



runtime:
summary.runtime,


environment:
summary.environment,


hardware:
summary.hardware,


gitSummary:
summary.gitSummary,


gitHistory:
summary.gitHistory,


installer:
summary.installer,


installerManager:
summary.installer?.manager

})

}



const coreData =
await apiGet(
"/spacemonkey/core"
)



if(
coreData.success
){

setCore(
coreData.data
)

}



const activityData =
await apiGet(
"/spacemonkey/activity"
)



if(
activityData.success
){

setActivities(
activityData.data.slice(
0,
10
)
)

}



setConnection(
"ONLINE"
)



setLastUpdate(
new Date()
)



}

catch(loadError){

console.error(
loadError
)



setConnection(
"OFFLINE"
)



setError(
loadError.message ||
"Järjestelmätilan lataaminen epäonnistui."
)



}

finally{

setLoading(false)

}

}



useEffect(()=>{

loadSystemData()



const interval =
setInterval(
loadSystemData,
10000
)



return () =>
clearInterval(
interval
)



},[])



function getPulseStatus(status){


if(status === "healthy"){
return "healthy"
}


if(status === "degraded"){
return "warning"
}


if(status === "warning"){
return "warning"
}


if(status === "error"){
return "error"
}


return "warning"


}



const brainHealthy =
pulse?.brain?.modules > 0 &&
pulse?.brain?.modules === pulse?.brain?.activeModules



return (

<>


{
error && (

<div>
{error}
</div>

)

}



{
loading && !pulse && (

<div>
Loading System Pulse...
</div>

)

}



<PulseCard
title="Status"
>


<StatusGlow
label="System"
value={
pulse?.status || "-"
}
status={
getPulseStatus(
pulse?.status
)
}
/>



<StatusGlow
label="AI Brain"
value={
`${pulse?.brain?.activeModules || 0}/${pulse?.brain?.modules || 0}`
}
status={
brainHealthy
?
"healthy"
:
"warning"
}
/>



<SecurityCard
security={
pulse?.security
}
/>



<InstallerCard
installer={
pulse?.installer
}
onCreateSnapshot={
createSnapshot
}
snapshotResult={
snapshotResult
}
onRequestRestore={
requestRestore
}
restoreApprovalResult={
restoreApprovalResult
}
/>



<InstallerManagerCard
manager={
pulse?.installerManager
}
/>



</PulseCard>


</>

)

}


export default SystemPulse
