/**
 * Wood-Booster HQ
 * Spacemonkey
 *
 * Architecture Importance Scorer v1
 *
 * Arvioi tiedoston merkityksen
 * arkkitehtuurissa.
 */

class ArchitectureImportanceScorer {


    constructor({

        logger = console,

    } = {}) {


        this.id =
            "architecture-importance-scorer"


        this.name =
            "Architecture Importance Scorer"


        this.logger =
            logger

    }



    score({

        file,

        role = "Unknown",

        layer = "unknown",

        dependencyCount = 0,

    }) {


        let importance = 0



        if (
            role ===
            "Frontend Entry Point"
        ) {

            importance += 10

        }



        if (
            role ===
            "Backend Service"
        ) {

            importance += 8

        }



        if (
            role ===
            "Backend API Route"
        ) {

            importance += 5

        }



        if (
            role ===
            "Frontend Page"
        ) {

            importance += 4

        }



        if (
            role ===
            "Frontend Component"
        ) {

            importance += 2

        }



        if (
            role ===
            "Database Schema"
        ) {

            importance += 9

        }



        importance +=
            dependencyCount



        return {

            file,

            role,

            layer,

            dependencyCount,

            importance,

        }

    }


}


export default ArchitectureImportanceScorer
