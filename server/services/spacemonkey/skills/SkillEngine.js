/**
 * Wood-Booster OS
 * Spacemonkey
 *
 * Skill Engine
 *
 * Hallitsee kaikkien Skillien rekisteröintiä
 * ja suorittamista.
 */

class SkillEngine {

    constructor({
        logger = console,
    } = {}) {

        this.logger = logger

        this.skills = new Map()

    }

    register(skill) {

        if (!skill?.id) {
            throw new Error("Skill id missing.")
        }

        this.skills.set(skill.id, skill)

        this.logger.info?.(
            `Skill registered: ${skill.id}`
        )

        return skill

    }

    has(id) {

        return this.skills.has(id)

    }

    get(id) {

        return this.skills.get(id)

    }

    list() {

        return [...this.skills.values()]

    }

    async execute(id, context) {

        const skill = this.skills.get(id)

        if (!skill) {

            throw new Error(
                `Unknown skill: ${id}`
            )

        }

        return await skill.execute(context)

    }

    summary() {

        return {

            totalSkills:
                this.skills.size,

            skills:
                [...this.skills.keys()],

        }

    }

}

export default SkillEngine
