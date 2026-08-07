/**
 * Wood-Booster OS
 * Spacemonkey
 *
 * Analyze Project Skill
 *
 * Analysoi projektin rakennetta ennen muiden
 * Skillien suorittamista.
 */

class AnalyzeProjectSkill {


    constructor({

        logger = console,

    } = {}) {


        this.id =
            "analyze-project"


        this.name =
            "Analyze Project Skill"


        this.logger =
            logger

    }



    async execute(context) {


        const project =
            context?.projectPath ?? null



        const analysis = {


            timestamp:

                new Date().toISOString(),



            project,



            language:

                context?.language ?? "unknown",



            framework:

                context?.framework ?? "unknown",



            files:

                context?.files ?? [],



            recommendations:

                [],

        }



        if (!project) {


            analysis.recommendations.push(

                "Project path missing."

            )

        }



        if (

            analysis.files.length === 0

        ) {


            analysis.recommendations.push(

                "No files supplied."

            )

        }



        return {


            success:

                true,



            skill:

                this.id,



            analysis,

        }

    }

}


export default AnalyzeProjectSkill
