async function getIdentityContext(){


  return {

    name:
      "Spacemonkey",

    role:
      "Enterprise AI Operator",

    platform:
      "Wood-Booster AI Platform"

  }


}







const identityProvider = {

  id:
    "identity",

  name:
    "Identity Provider",

  priority:
    20,

  getContext:
    getIdentityContext

}







export {

  identityProvider,

  getIdentityContext

}
