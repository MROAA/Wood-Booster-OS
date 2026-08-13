/**
 * Wood-Booster HQ
 * Spacemonkey
 *
 * Goal Engine
 *
 * Muuntaa käyttäjän pyynnön
 * korkeantason tavoitteeksi.
 */

class GoalEngine {

    constructor({
        logger = console,
    } = {}) {

        this.logger = logger

    }

    async identify(task = {}) {

        const text =
            JSON.stringify(task).toLowerCase()

        if (
            text.includes("wordpress")
        ) {

            return {

                id: "manage-wordpress",

                domain: "wordpress",

                priority: "high",

            }

        }

        if (
            text.includes("instagram")
        ) {

            return {

                id: "manage-instagram",

                domain: "marketing",

                priority: "high",

            }

        }

        if (
            text.includes("python") ||
            text.includes("react") ||
            text.includes("cpp")
        ) {

            return {

                id: "software-development",

                domain: "development",

                priority: "high",

            }

        }

        return {

            id: "general-assistance",

            domain: "general",

            priority: "normal",

        }

    }

}

export default GoalEngine
