import {
  writeCodeChange,
} from "./services/aiBrainV2/system/spacemonkey/spacemonkeyCodeWriter.js"


const result = await writeCodeChange({

  filePath:
    "spacemonkey-writer-test.txt",

  content:
    "SPACEMONKEY WAS HERE\n",

  mode:
    "safe_write"

})


console.log(result)
