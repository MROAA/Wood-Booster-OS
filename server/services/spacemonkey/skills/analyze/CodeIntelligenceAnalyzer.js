/**
 * Wood-Booster HQ
 * Spacemonkey
 *
 * Code Intelligence Analyzer v1
 *
 * Tunnistaa tiedostojen rooleja
 * projektirakenteessa.
 */

class CodeIntelligenceAnalyzer {


    constructor({

        logger = console,

    } = {}) {


        this.id =
            "code-intelligence-analyzer"


        this.name =
            "Code Intelligence Analyzer"


        this.logger =
            logger

    }



    analyze(files = []) {


        const results = []


        for (const file of files) {


            const role =
                this.detectRole(file)


            results.push({

                file,

                role,

            })


        }


        return {

            total:
                results.length,

            files:
                results,

        }


    }



    detectRole(file) {


        const value =
            file.toLowerCase()



        if (
            value.includes("/pages/")
        ) {

            return "React Page Component"

        }



        if (
            value.includes("/components/")
        ) {

            return "React UI Component"

        }



        if (
            value.includes("/routes/")
        ) {

            return "Backend API Route"

        }



        if (
            value.includes("/services/")
        ) {

            return "Backend Service"

        }



        if (
            value.includes("schema.prisma")
        ) {

            return "Database Schema"

        }



        if (
            value.includes("vite.config")
        ) {

            return "Build Configuration"

        }



        if (
            value.includes("test")
        ) {

            return "Test File"

        }



        if (
            value.includes("package.json")
        ) {

            return "Project Configuration"

        }



        return "Unknown"

    }


}


export default CodeIntelligenceAnalyzer
