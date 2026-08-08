/*
WOOD-BOOSTER HQ

RECOVERY APPROVAL POLICY

Vastuut:

- arvioi palautuksen turvallisuusehdot
- antaa päätösehdotuksen gatewaylle

Ei:

- suorita palautusta
- muuta järjestelmää
*/


export function validateRestoreApproval(
{
snapshot,
validation = {},
} = {}
){

const checks = {

snapshotExists:
Boolean(snapshot),

validationHealthy:
validation.status === "healthy"
||
validation.score >= 90,

metadataValid:
Boolean(validation.metadata)

}


const failedChecks =
Object.entries(checks)
.filter(
([, value]) => !value
)
.map(
([key]) => key
)



const allowed =
failedChecks.length === 0



return {

allowed,

status:
allowed
?
"approved-for-confirmation"
:
"blocked",

checks,

failedChecks,

reason:
allowed
?
"Validation passed"
:
"Validation failed",

checkedAt:
new Date().toISOString()

}

}
