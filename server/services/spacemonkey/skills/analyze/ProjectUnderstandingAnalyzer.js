/**
 * Wood-Booster HQ
 * Spacemonkey
 *
 * Project Understanding Analyzer v1
 *
 * Muodostaa ymmärryksen projektin
 * tärkeimmistä rakenteista.
 */

class ProjectUnderstandingAnalyzer {

    constructor({
        logger = console,
    } = {}) {

        this.id =
            "project-understanding-analyzer"

        this.name =
            "Project Understanding Analyzer"

        this.logger =
            logger

    }


    analyze(structure) {

        return {

            frontend: {

                role:
                    "User interface layer",

                detected:
                    structure.frontend?.detected ?? false,

                path:
                    structure.frontend?.path ?? null,

            },


            backend: {

                role:
                    "Server and API layer",

                detected:
                    structure.backend?.detected ?? false,

                path:
                    structure.backend?.path ?? null,

            },


            database: {

                role:
                    "Data persistence layer",

                detected:
                    structure.database?.detected ?? false,

                path:
                    structure.database?.path ?? null,

            },


            documentation: {

                role:
                    "Knowledge and documentation layer",

                detected:
                    structure.documentation?.detected ?? false,

                path:
                    structure.documentation?.path ?? null,

            },

        }

    }

}


export default ProjectUnderstandingAnalyzer
