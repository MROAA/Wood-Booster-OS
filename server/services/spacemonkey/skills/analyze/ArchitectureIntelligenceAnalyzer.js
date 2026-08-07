/**
 * Wood-Booster OS
 * Spacemonkey
 *
 * Architecture Intelligence Analyzer v1
 *
 * Muodostaa korkeamman tason
 * ymmärryksen dependency graphista.
 */

class ArchitectureIntelligenceAnalyzer {


    constructor({

        logger = console,

    } = {}) {


        this.id =
            "architecture-intelligence-analyzer"


        this.name =
            "Architecture Intelligence Analyzer"


        this.logger =
            logger

    }



    analyze(graph = {}) {


        const nodes =
            graph.nodes ?? []


        const edges =
            graph.edges ?? []



        const modules =
            nodes.map(node => ({


                file:
                    node.id,


                imports:
                    node.imports ?? [],


                exports:
                    node.exports ?? [],


                importance:
                    this.calculateImportance(
                        node.id,
                        edges
                    )

            }))



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
