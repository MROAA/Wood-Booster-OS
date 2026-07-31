const providers = {}







function registerContextProvider({

  id,

  name,

  priority = 100,

  getContext

}) {


  providers[id] = {

    id,

    name,

    priority,

    getContext

  }


  return providers[id]

}







function unregisterContextProvider(id){


  delete providers[id]


}







function getContextProvider(id){


  return providers[id] || null


}







function getContextProviders(){


  return Object.values(
    providers
  )
  .sort(
    (
      a,
      b
    ) =>
      a.priority - b.priority
  )


}







async function collectContextFromProviders({

  request = {}

} = {}) {


  const context = {}





  const activeProviders =
    getContextProviders()





  for(
    const provider
    of activeProviders
  ){


    if(
      typeof provider.getContext !==
      "function"
    ){

      continue

    }





    context[provider.id] =
      await provider.getContext({
        request
      })


  }





  return context


}







function clearContextProviders(){


  Object.keys(
    providers
  )
  .forEach(
    key =>
      delete providers[key]
  )


}







export {

  registerContextProvider,

  unregisterContextProvider,

  getContextProvider,

  getContextProviders,

  collectContextFromProviders,

  clearContextProviders

}
