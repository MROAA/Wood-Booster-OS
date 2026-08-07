/**
 * Wood-Booster OS
 * Spacemonkey
 *
 * Code Dependency Graph Builder v1
 *
 * Rakentaa riippuvuusverkon
 * analysoiduista import-suhteista.
 */

class CodeDependencyGraphBuilder {


    constructor({

        logger = console,

    } = {}) {


        this.id =
            "code-dependency-graph-builder"


        this.name =
            "Code Dependency Graph Builder"


        this.logger =
            logger

    }



    build(files = []) {


        const nodes = []

        const edges = []



        for (const file of files) {


            nodes.push({

                id:
                    file.file,

                imports:
                    file.imports ?? [],

                exports:
                    file.exports ?? [],

            })



            for (const dependency of file.imports ?? []) {


                edges.push({

                    from:
                        file.file,

                    to:
                        dependency,

                })

            }

        }



        return {

            nodes,

            edges,

            nodeCount:
                nodes.length,

            edgeCount:
                edges.length,

        }

    }


}


export default CodeDependencyGraphBuilder
