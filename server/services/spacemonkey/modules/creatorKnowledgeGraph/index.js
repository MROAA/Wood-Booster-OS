const MODULE_ID = "creator-knowledge-graph"



const nodes = []

const connections = []



function addNode({

  id,

  type,

  title,

  content,

}){

  const node = {

    id,

    type,

    title,

    content,

    created:
      new Date().toISOString(),

  }


  nodes.push(node)


  return node

}



function addConnection({

  from,

  to,

  relation,

}){

  const connection = {

    id:
      `connection-${Date.now()}`,

    from,

    to,

    relation,

    created:
      new Date().toISOString(),

  }


  connections.push(connection)


  return connection

}



function getGraph(){

  return {

    moduleId:
      MODULE_ID,

    timestamp:
      new Date().toISOString(),

    nodes,

    connections,

    nodeCount:
      nodes.length,

    connectionCount:
      connections.length,

  }

}



function findNode(id){

  return nodes.find(
    node =>
      node.id === id
  ) || null

}



function getConnectionsForNode(id){

  return connections.filter(

    connection =>

      connection.from === id
      ||
      connection.to === id

  )

}



function getNodesByType(type){

  return nodes.filter(
    node =>
      node.type === type
  )

}



export {

  MODULE_ID,

  addNode,

  addConnection,

  getGraph,

  findNode,

  getConnectionsForNode,

  getNodesByType,

}
