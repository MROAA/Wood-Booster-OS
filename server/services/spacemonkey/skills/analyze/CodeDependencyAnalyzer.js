/**
 * Wood-Booster OS
 * Spacemonkey
 *
 * Code Dependency Analyzer v1
 *
 * Analysoi JavaScript-moduulien
 * import/export riippuvuuksia.
 */

import fs from "fs/promises"


class CodeDependencyAnalyzer {


    constructor({

        logger = console,

    } = {}) {


        this.id =
            "code-dependency-analyzer"


        this.name =
            "Code Dependency Analyzer"


        this.logger =
            logger

    }



    async analyze(files = []) {


        const results = []


        for (const file of files) {


            if (
                !file.endsWith(".js") &&
                !file.endsWith(".jsx")
            ) {

                continue

            }


            const content =
                await fs.readFile(
                    file,
                    "utf8"
                )


            results.push({

                file,

                imports:
                    this.extractImports(
                        content
                    ),

                exports:
                    this.extractExports(
                        content
                    ),

            })


        }


        return {

            total:
                results.length,

            files:
                results,

        }

    }



    extractImports(content) {


        const imports = []


        const regex =
            /import\s+.*?\s+from\s+["'](.+?)["']/g


        let match


        while (
            (match = regex.exec(content))
        ) {

            imports.push(
                match[1]
            )

        }


        return imports

    }



    extractExports(content) {


        const exports = []


        if (
            content.includes(
                "export default"
            )
        ) {

            exports.push(
                "default"
            )

        }


        const regex =
            /export\s+(?:const|let|var|function|class)\s+([A-Za-z0-9_]+)/g


        let match


        while (
            (match = regex.exec(content))
        ) {

            exports.push(
                match[1]
            )

        }


        return exports

    }


}


export default CodeDependencyAnalyzer
