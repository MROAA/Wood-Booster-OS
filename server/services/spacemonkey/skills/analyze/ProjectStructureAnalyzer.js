/**
 * Wood-Booster OS
 * Spacemonkey
 *
 * Project Structure Analyzer
 *
 * Luo projektin rakenteellisen kartan.
 */

class ProjectStructureAnalyzer {


    constructor({

        logger = console,

    } = {}) {


        this.id =
            "project-structure-analyzer"


        this.name =
            "Project Structure Analyzer"


        this.logger =
            logger

    }



    analyze(files = []) {


        const paths =
            files.map(
                file =>
                    file.toLowerCase()
            )



        return {


            frontend: {

                detected:

                    paths.some(
                        file =>
                            file.includes("/src/")
                    ),

                path:
                    "src/",

            },



            backend: {

                detected:

                    paths.some(
                        file =>
                            file.includes("/server/")
                    ),

                path:
                    "server/",

            },



            database: {

                detected:

                    paths.some(
                        file =>
                            file.includes("/prisma/")
                    ),

                path:
                    "prisma/",

            },



            documentation: {

                detected:

                    paths.some(
                        file =>
                            file.includes("/docs/")
                    ),

                path:
                    "docs/",

            },


        }

    }


}


export default ProjectStructureAnalyzer
