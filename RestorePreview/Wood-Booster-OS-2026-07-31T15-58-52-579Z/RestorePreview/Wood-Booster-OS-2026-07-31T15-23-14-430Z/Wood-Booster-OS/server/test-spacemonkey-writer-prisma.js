import {
  PrismaClient,
} from "./generated/prisma/index.js"


import {
  writeCodeChange,
} from "./services/aiBrainV2/system/spacemonkey/spacemonkeyCodeWriter.js"



const prisma =
  new PrismaClient()



const result =

  await writeCodeChange({

    prisma,

    filePath:
      "spacemonkey-writer-test.txt",

    content:
      "SPACEMONKEY PRISMA TEST\n",

    mode:
      "safe_write"

  })



console.log(result)



await prisma.$disconnect()
