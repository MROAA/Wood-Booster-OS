import {
  loadModuleKnowledge,
} from "./services/aiBrainV2/knowledge/providers/moduleProvider.js"



const result =
  loadModuleKnowledge()



console.log(
  "\nMODULE PROVIDER\n",
)


console.dir(
  result,
  {
    depth:
      null,

    colors:
      true,
  },
)


if (
  result.success
) {
  console.log(
    "\nMODULE PROVIDER READY\n",
  )

  console.log(
    `Dokumentteja: ${result.total}`,
  )
}
else {
  console.error(
    "\nMODULE PROVIDER FAILED\n",
  )

  process.exitCode =
    1
}
