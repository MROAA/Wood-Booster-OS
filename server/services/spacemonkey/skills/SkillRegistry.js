/**
 * Wood-Booster OS
 * Skill Registry
 *
 * Rekisteri Spacemonkeyn taidoille.
 */

class SkillRegistry {

  constructor() {

    this.skills = new Map()
  }

  register(skill) {

    if (!skill?.id) {
      throw new Error("Skill id missing")
    }

    this.skills.set(
      skill.id,
      skill
    )

    return true
  }

  unregister(id) {

    return this.skills.delete(id)
  }

  has(id) {

    return this.skills.has(id)
  }

  get(id) {

    return this.skills.get(id)
  }

  list() {

    return [
      ...this.skills.values(),
    ]
  }

  async execute(
    id,
    input,
    runtime
  ) {

    const skill =
      this.skills.get(id)

    if (!skill) {

      return {
        success: false,
        error: "Unknown skill",
      }
    }

    return skill.execute(
      input,
      runtime
    )
  }

  summary() {

    return {

      total:
        this.skills.size,

      skills:
        this.list().map(
          skill => skill.id
        ),
    }
  }
}

export default SkillRegistry
