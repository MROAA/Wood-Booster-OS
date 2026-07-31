import ModuleOverviewModule from "./ModuleOverviewModule"

import ModuleStatusModule from "./ModuleStatusModule"

import ModuleRegistryViewer from "./ModuleRegistryViewer"

import RuntimeModule from "./RuntimeModule"

import SecurityModule from "./SecurityModule"

import IdentityModule from "./IdentityModule"

import CapabilityModule from "./CapabilityModule"

import CapabilityHealthModule from "./CapabilityHealthModule"

import LearningModule from "./LearningModule"

import GoalModule from "./GoalModule"

import TaskModule from "./TaskModule"

import WorkflowModule from "./WorkflowModule"

import ExecutionModule from "./ExecutionModule"

import PersonalityModule from "./PersonalityModule"

import KnowledgeModule from "./KnowledgeModule"

import KnowledgeHealthModule from "./KnowledgeHealthModule"

import MemoryModule from "./MemoryModule"

import MemoryHealthModule from "./MemoryHealthModule"

import WorldModelModule from "./WorldModelModule"

import WorldModelHealthModule from "./WorldModelHealthModule"

import ReflectionModule from "./ReflectionModule"

import ReflectionHealthModule from "./ReflectionHealthModule"

import ActivityModule from "./ActivityModule"

import ActivityHealthModule from "./ActivityHealthModule"

import DecisionModule from "./DecisionModule"

import DecisionHealthModule from "./DecisionHealthModule"





function SpacemonkeySystemPanel({
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


      <ModuleOverviewModule />


      <ModuleStatusModule />


      <ModuleRegistryViewer />



      <RuntimeModule
        runtime={
          core?.runtime
        }
      />



      <SecurityModule
        security={
          core?.security
        }
      />



      <IdentityModule
        identity={
          core?.identity
        }
      />



      <CapabilityModule
        capabilities={
          core?.capabilities
        }
      />



      <CapabilityHealthModule
        capabilities={
          core?.capabilities
        }
      />



      <LearningModule
        learning={
          core?.learning
        }
      />



      <GoalModule
        goal={
          core?.goal
        }
      />



      <TaskModule
        tasks={
          core?.tasks
        }
      />



      <WorkflowModule
        workflow={
          core?.workflow
        }
      />



      <ExecutionModule
        execution={
          core?.execution
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



      <KnowledgeHealthModule
        knowledge={
          core?.knowledge
        }
      />



      <MemoryModule
        memory={
          core?.memory
        }
      />



      <MemoryHealthModule
        memory={
          core?.memory
        }
      />



      <WorldModelModule
        worldModel={
          core?.worldModel
        }
      />



      <WorldModelHealthModule
        worldModel={
          core?.worldModel
        }
      />



      <ReflectionModule
        reflection={
          core?.reflection
        }
      />



      <ReflectionHealthModule
        reflection={
          core?.reflection
        }
      />



      <ActivityModule
        activities={
          activities
        }
      />



      <ActivityHealthModule
        activity={
          core?.activity
        }
      />



      <DecisionModule
        decision={
          core?.decision ||
          core?.cognitive?.decision
        }
      />



      <DecisionHealthModule
        decision={
          core?.decision ||
          core?.cognitive?.decision
        }
      />


    </div>

  )

}


export default SpacemonkeySystemPanel
