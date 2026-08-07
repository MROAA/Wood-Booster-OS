/**
 * Wood-Booster OS
 * Spacemonkey
 *
 * Architecture Role Detector v2
 *
 * Tunnistaa tiedoston arkkitehtuurisen roolin
 * absoluuttisista ja suhteellisista poluista.
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


        const normalized =
            file
                .toLowerCase()
                .replaceAll("\\", "/")



        if (
            normalized.includes("/src/pages/") ||
            normalized.startsWith("src/pages/")
        ) {

            return {

                role:
                    "Frontend Page",

                layer:
                    "frontend",

            }

        }



        if (
            normalized.includes("/src/components/") ||
            normalized.startsWith("src/components/")
        ) {

            return {

                role:
                    "Frontend Component",

                layer:
                    "frontend",

            }

        }



        if (
            normalized.includes("/server/routes/") ||
            normalized.startsWith("server/routes/")
        ) {

            return {

                role:
                    "Backend API Route",

                layer:
                    "backend",

            }

        }



        if (
            normalized.includes("/server/services/") ||
            normalized.startsWith("server/services/")
        ) {

            return {

                role:
                    "Backend Service",

                layer:
                    "backend",

            }

        }



        if (
            normalized.endsWith(
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
            normalized.includes("/tests/") ||
            normalized.startsWith("tests/")
        ) {

            return {

                role:
                    "Test Module",

                layer:
                    "testing",

            }

        }



        if (
            normalized === "src/app.jsx" ||
            normalized.endsWith("/src/app.jsx")
        ) {

            return {

                role:
                    "Frontend Entry Point",

                layer:
                    "frontend",

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
