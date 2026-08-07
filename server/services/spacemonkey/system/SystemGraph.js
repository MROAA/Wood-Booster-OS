/**
 * Wood-Booster OS
 * Spacemonkey
 *
 * System Graph
 *
 * Keskitetty kuvaus koko järjestelmästä.
 */

class SystemGraph {

    constructor({
        logger = console,
    } = {}) {

        this.logger = logger

        this.nodes = new Map()

        this.edges = []

    }

    registerNode(node) {

        if (!node?.id) {
            throw new Error("Node id missing.")
        }

        this.nodes.set(node.id, node)

        return node

    }

    connect(from, to, type = "depends-on") {

        this.edges.push({

            from,

            to,

            type,

        })

    }

    getNode(id) {

        return this.nodes.get(id)

    }

    neighbors(id) {

        return this.edges.filter(edge =>
            edge.from === id
        )

    }

    summary() {

        return {

            nodes: this.nodes.size,

            edges: this.edges.length,

            registered: [
                ...this.nodes.keys()
            ]

        }

    }

}

export default SystemGraph
