import IdentityModule from "./IdentityModule"

import PersonalityModule from "./PersonalityModule"

import KnowledgeModule from "./KnowledgeModule"

import MemoryModule from "./MemoryModule"

import WorldModelModule from "./WorldModelModule"

import ReflectionModule from "./ReflectionModule"

import ActivityModule from "./ActivityModule"

import DecisionModule from "./DecisionModule"

import RuntimeModule from "./RuntimeModule"





function SpacemonkeyModuleRegistry({
  core,
  activities = []
}) {


  return (

    <div
      className="
        flex
        flex-col
        gap-6
      "
    >


      <RuntimeModule
        runtime={
          core?.runtime
        }
      />





      <IdentityModule
        identity={
          core?.identity
        }
      />





      <PersonalityModule
        personality={
          core?.persona
        }
      />





      <KnowledgeModule
        knowledge={
          core?.knowledge
        }
      />





      <MemoryModule
        memory={
          core?.memory
        }
      />





      <WorldModelModule
        worldModel={
          core?.worldModel
        }
      />





      <ReflectionModule
        reflection={
          core?.reflection
        }
      />





      <ActivityModule
        activities={
          activities
        }
      />





      <DecisionModule
        decision={
          core?.decision ||
          core?.cognitive?.decision
        }
      />


    </div>

  )

}


export default SpacemonkeyModuleRegistry
