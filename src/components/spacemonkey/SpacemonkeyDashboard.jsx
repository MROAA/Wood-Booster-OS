import IdentityCard from "./IdentityCard"

import StatusOrb from "./StatusOrb"

import AvatarCoreCard from "./AvatarCoreCard"

import PersonalityCard from "./PersonalityCard"

import KnowledgeCard from "./KnowledgeCard"

import MemoryCard from "./MemoryCard"

import WorldModelCard from "./WorldModelCard"

import ReflectionCard from "./ReflectionCard"

import ActivityFeed from "./ActivityFeed"

import DecisionCard from "./DecisionCard"

import SafetyCard from "./SafetyCard"

import SpacemonkeyCognitiveTimeline from "./SpacemonkeyCognitiveTimeline"

import SpacemonkeyPipeline from "./SpacemonkeyPipeline"

import SpacemonkeyModules from "./SpacemonkeyModules"

import SpacemonkeyRuntime from "./SpacemonkeyRuntime"





function SpacemonkeyDashboard({
  core,
  connection,
  activities
}) {


  return (

    <div
      className="
        w-full
        flex
        flex-col
        gap-6
      "
    >


      <section
        className="
          card
          p-6
          flex
          justify-between
          items-center
        "
      >

        <StatusOrb
          status={
            core?.status
          }

          cognitive={
            core?.cognitive?.state
          }
        />


        <p
          className="
            text-sm
            text-[var(--wood-muted)]
          "
        >
          Runtime:

          {" "}

          {connection}

        </p>


      </section>





      <IdentityCard
        identity={
          core?.identity
        }
      />





      <AvatarCoreCard
        core={core}
      />




<PersonalityCard
  persona={
    core?.persona
  }
/>




      <KnowledgeCard
        knowledge={
          core?.knowledge
        }
      />





      <MemoryCard
        memory={
          core?.memory
        }
      />





      <WorldModelCard
        worldModel={
          core?.worldModel
        }
      />





      <ReflectionCard
        cognitive={
          core?.cognitive
        }

        decision={
          core?.decision
        }
      />





<ActivityFeed
  activities={
    activities
  }
/>




      <SpacemonkeyCognitiveTimeline
        activity={
          activities
        }
      />




      <SpacemonkeyPipeline
        activity={
          activities
        }
      />


      <section
        className="
          card
          p-6
        "
      >

        <h2
          className="
            text-sm
            uppercase
            tracking-widest
          "
        >
          ⬢ Cognitive State
        </h2>


        <p
          className="
            mt-5
            text-xl
            text-[var(--wood-accent)]
          "
        >

          {
            core?.cognitive?.state?.toUpperCase()
            ||
            "CHECKING"
          }

        </p>


        <p
          className="
            mt-3
            text-sm
            text-[var(--wood-muted)]
          "
        >

          {
            core?.cognitive?.thinking ||
            "-"
          }

        </p>


      </section>





      <DecisionCard
        decision={
          core?.decision
        }
      />




      <SafetyCard
        safety={
          core?.safety
        }
      />




      <SpacemonkeyModules />




      <SpacemonkeyRuntime />


    </div>

  )

}


export default SpacemonkeyDashboard
