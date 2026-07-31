import {
  addNode,
  addConnection,
  getGraph,
  findNode,
  getConnectionsForNode,
  getNodesByType,
} from "./index.js"



console.log(
  "=== SPACEMONEY CREATOR KNOWLEDGE GRAPH ==="
)



addNode({

  id:
    "philosophy-modular",

  type:
    "philosophy",

  title:
    "Modular Development",

  content:
    "Build safe isolated modules.",

})



addNode({

  id:
    "decision-architecture",

  type:
    "decision",

  title:
    "Protect Core",

  content:
    "Do not modify stable core without reason.",

})



addNode({

  id:
    "lesson-growth",

  type:
    "lesson",

  title:
    "Small Steps",

  content:
    "Incremental development creates reliable systems.",

})



addConnection({

  from:
    "decision-architecture",

  to:
    "philosophy-modular",

  relation:
    "influenced-by",

})



addConnection({

  from:
    "decision-architecture",

  to:
    "lesson-growth",

  relation:
    "creates",

})



console.log(
  "\n=== GRAPH ==="
)



console.log(
  getGraph()
)



console.log(
  "\n=== FIND DECISION ==="
)



console.log(
  findNode(
    "decision-architecture"
  )
)



console.log(
  "\n=== DECISION CONNECTIONS ==="
)



console.log(
  getConnectionsForNode(
    "decision-architecture"
  )
)



console.log(
  "\n=== PHILOSOPHY NODES ==="
)



console.log(
  getNodesByType(
    "philosophy"
  )
)
