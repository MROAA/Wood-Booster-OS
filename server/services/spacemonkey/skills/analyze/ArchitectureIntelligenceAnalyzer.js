/**
 * Wood-Booster OS
 * Spacemonkey
 *
 * Architecture Intelligence Analyzer v2
 *
 * Yhdistää dependency graphin
 * ja arkkitehtuuriroolien tunnistuksen.
 */

import ArchitectureRoleDetector from "./ArchitectureRoleDetector.js"


class ArchitectureIntelligenceAnalyzer {


    constructor({

        logger = console,

        roleDetector =
            new ArchitectureRoleDetector({
                logger,
            }),

    } = {}) {


        this.id =
            "architecture-intelligence-analyzer"


        this.name =
            "Architecture Intelligence Analyzer"


        this.logger =
            logger


        this.roleDetector =
            roleDetector

    }



    analyze(graph = {}) {


        const nodes =
            graph.nodes ?? []


        const edges =
            graph.edges ?? []



        const modules =
            nodes.map(node => {


                const architecture =
                    this.roleDetector.detect(
                        node.id
                    )


                return {

                    file:
                        node.id,


                    imports:
                        node.imports ?? [],


                    exports:
                        node.exports ?? [],


                    role:
                        architecture.role,


                    layer:
                        architecture.layer,


                    importance:
                        this.calculateImportance(
                            node.id,
                            edges
                        ),

                }


            })



        const criticalFiles =
            modules
                .filter(
                    module =>
                        module.importance > 0
                )
                .sort(
                    (a, b) =>
                        b.importance -
                        a.importance
                )



        return {


            moduleCount:
                modules.length,


            connectionCount:
                edges.length,


            modules,


            criticalFiles,


        }

    }



    calculateImportance(file, edges) {


        let score = 0



        for (const edge of edges) {


            if (
                edge.to === file
            ) {

                score++

            }


        }



        return score

    }


}


export default ArchitectureIntelligenceAnalyzer
