/**
 * Wood-Booster OS
 * Spacemonkey
 *
 * Architecture Role Detector v1
 *
 * Tunnistaa tiedoston arkkitehtuurisen roolin
 * polun ja tiedostonimen perusteella.
 */

class ArchitectureRoleDetector {


    constructor({

        logger = console,

    } = {}) {


        this.id =
            "architecture-role-detector"


        this.name =
            "Architecture Role Detector"


        this.logger =
            logger

    }



    detect(file) {


        const lower =
            file.toLowerCase()



        if (
            lower.includes("/src/pages/")
        ) {

            return {

                role:
                    "Frontend Page",

                layer:
                    "frontend",

            }

        }



        if (
            lower.includes("/src/components/")
        ) {

            return {

                role:
                    "Frontend Component",

                layer:
                    "frontend",

            }

        }



        if (
            lower.includes("/server/routes/")
        ) {

            return {

                role:
                    "Backend API Route",

                layer:
                    "backend",

            }

        }



        if (
            lower.includes("/server/services/")
        ) {

            return {

                role:
                    "Backend Service",

                layer:
                    "backend",

            }

        }



        if (
            lower.endsWith(
                "schema.prisma"
            )
        ) {

            return {

                role:
                    "Database Schema",

                layer:
                    "database",

            }

        }



        if (
            lower.includes("/tests/")
        ) {

            return {

                role:
                    "Test Module",

                layer:
                    "testing",

            }

        }



        return {

            role:
                "Unknown",

            layer:
                "unknown",

        }

    }


}


export default ArchitectureRoleDetector
