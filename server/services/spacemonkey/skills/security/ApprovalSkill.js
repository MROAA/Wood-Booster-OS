/**
 * Wood-Booster HQ
 * Spacemonkey
 *
 * Approval Skill
 *
 * Hallitsee käyttäjän hyväksyntää
 * vaativia toimintoja.
 */

class ApprovalSkill {

    constructor({
        logger = console,
    } = {}) {

        this.id =
            "approval"

        this.name =
            "Approval Skill"

        this.logger =
            logger

    }


    async execute(context) {

        const action =
            context?.action


        if (!action) {

            throw new Error(
                "Approval action missing."
            )

        }


        return {

            success: true,

            approved: false,

            status:
                "waiting-for-user",

            action,

            message:
                "User approval required before execution.",

        }

    }

}


export default ApprovalSkill
