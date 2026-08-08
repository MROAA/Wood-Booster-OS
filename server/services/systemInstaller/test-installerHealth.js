import {
    getInstallerHealth
} from "./installerHealth.js"


const result =
    getInstallerHealth()


console.log(
    JSON.stringify(
        result,
        null,
        2
    )
)
