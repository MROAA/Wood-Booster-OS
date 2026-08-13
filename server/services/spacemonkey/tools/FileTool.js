import fs from "node:fs/promises"
import path from "node:path"

const FileTool = {

  id: "file",

  name: "File Tool",

  description:
    "Turvallinen tiedostotyökalu Spacemonkeylle.",

  async execute(input = {}) {

    const {
      action,
      file,
      content = "",
    } = input

    if (!action) {
      return {
        success: false,
        error: "Missing action",
      }
    }

    try {

      switch (action) {

        case "read": {

          const data =
            await fs.readFile(
              file,
              "utf8"
            )

          return {
            success: true,
            content: data,
          }
        }

        case "write": {

          await fs.writeFile(
            file,
            content,
            "utf8"
          )

          return {
            success: true,
          }
        }

        case "append": {

          await fs.appendFile(
            file,
            content,
            "utf8"
          )

          return {
            success: true,
          }
        }

        case "exists": {

          try {

            await fs.access(file)

            return {
              success: true,
              exists: true,
            }

          } catch {

            return {
              success: true,
              exists: false,
            }
          }
        }

        case "mkdir": {

          await fs.mkdir(
            file,
            {
              recursive: true,
            }
          )

          return {
            success: true,
          }
        }

        case "list": {

          const files =
            await fs.readdir(file)

          return {
            success: true,
            files,
          }
        }

        case "delete": {

          await fs.rm(
            file,
            {
              recursive: true,
              force: true,
            }
          )

          return {
            success: true,
          }
        }

        case "stat": {

          const stat =
            await fs.stat(file)

          return {
            success: true,
            stat,
          }
        }

        default:

          return {
            success: false,
            error:
              `Unknown action: ${action}`,
          }
      }

    } catch (error) {

      return {
        success: false,
        error: error.message,
      }
    }
  },
}

export default FileTool
