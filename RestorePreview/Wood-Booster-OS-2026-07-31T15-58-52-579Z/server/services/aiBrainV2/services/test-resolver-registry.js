import {
  getRegisteredResolvers,
  getResolver,
} from "../context/registry/contextResolverRegistry.js"



console.log(
  "REGISTERED CONTEXT RESOLVERS"
)



console.log(

  getRegisteredResolvers()

)



console.log(
  "IDENTITY RESOLVER"
)



console.log(

  typeof getResolver(
    "identity"
  )

)
