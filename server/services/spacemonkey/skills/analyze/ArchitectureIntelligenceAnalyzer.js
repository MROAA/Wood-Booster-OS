/**
 * Wood-Booster HQ
 * Spacemonkey
 *
 * Architecture Intelligence Analyzer v3
 *
 * Yhdistää:
 * - dependency graph
 * - architecture roles
 * - importance scoring
 */

import ArchitectureRoleDetector from "./ArchitectureRoleDetector.js"
import ArchitectureImportanceScorer from "./ArchitectureImportanceScorer.js"


class ArchitectureIntelligenceAnalyzer {


    constructor({

        logger = console,

        roleDetector =
            new ArchitectureRoleDetector({
                logger,
            }),

        importanceScorer =
            new ArchitectureImportanceScorer({
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


        this.importanceScorer =
            importanceScorer

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



                const dependencyCount =
                    this.getDependencyCount(
                        node.id,
                        edges
                    )



                const importance =
                    this.importanceScorer.score({

                        file:
                            node.id,

                        role:
                            architecture.role,

                        layer:
                            architecture.layer,

                        dependencyCount,

                    })



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

                    dependencyCount,

                    importance:
                        importance.importance,

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



    getDependencyCount(file, edges) {


        return edges.filter(

            edge =>
                edge.to === file

        ).length

    }


}


export default ArchitectureIntelligenceAnalyzer
