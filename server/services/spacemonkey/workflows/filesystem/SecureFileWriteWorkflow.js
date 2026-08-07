/**
 * Wood-Booster OS
 * Spacemonkey
 *
 * Secure File Write Workflow
 *
 * Turvallinen tiedoston muokkausketju.
 */

class SecureFileWriteWorkflow {

    constructor({

        permissionSkill,

        writeFileSkill,

        auditLogSkill,

        logger = console,

    } = {}) {


        this.id =
            "secure-file-write"


        this.name =
            "Secure File Write Workflow"


        this.permissionSkill =
            permissionSkill


        this.writeFileSkill =
            writeFileSkill


        this.auditLogSkill =
            auditLogSkill


        this.logger =
            logger

    }


    async execute(context) {


        const permission =
            await this.permissionSkill.execute({

                path:
                    context.path

            })


        if (
            !permission.allowed
        ) {

            return {

                success: false,

                step:
                    "permission",

                reason:
                    permission.reason,

            }

        }


        const result =
            await this.writeFileSkill.execute(
                context
            )


        await this.auditLogSkill.execute({

            agent:
                context.agent,

            action:
                "write-file",

            path:
                context.path,

            result:
                result,

        })


        return {

            success: true,

            workflow:
                this.id,

            result,

        }

    }

}


export default SecureFileWriteWorkflow
