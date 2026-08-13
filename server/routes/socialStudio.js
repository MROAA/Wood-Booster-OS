import express from "express"

import {
  generateSocialDraft,
  PLATFORMS,
} from "../services/socialContentGenerator.js"

import {
  getSpacemonkeyToolBus,
  getSpacemonkeyWorkflowEngine,
} from "../services/spacemonkey/spacemonkeyRuntimeBootstrap.js"

export default function createSocialStudioRouter(prisma) {
  const router = express.Router()

  /*
   * POST /api/projects/:id/social-drafts
   *
   * Luo uuden julkaisuluonnoksen AI:n avulla. Ei koskaan julkaise
   * mitään automaattisesti - luonnos jää odottamaan ihmisen
   * tarkistusta (server/ai-knowledge/AI_BRAIN_705_SOCIAL_MEDIA_
   * INTEGRATION.txt: "Never publish automatically").
   */
  router.post(
    "/projects/:id/social-drafts",
    async (request, response) => {
      try {
        const projectId = Number(request.params.id)

        const platform = PLATFORMS.includes(request.body?.platform)
          ? request.body.platform
          : "instagram"

        const project = await prisma.project.findUnique({
          where: {
            id: projectId,
          },
          include: {
            materials: true,
            customer: true,
          },
        })

        if (!project) {
          return response.status(404).json({
            error: "Projektia ei löytynyt",
          })
        }

        const generated = await generateSocialDraft({
          project,
          platform,
        })

        const draft = await prisma.socialPostDraft.create({
          data: {
            projectId,
            caption: generated.caption,
            hashtags: generated.hashtags,
            platform,
            status: "draft",
          },
        })

        response.status(201).json(draft)
      } catch (error) {
        console.error(error)

        response.status(500).json({
          error: error.message,
        })
      }
    },
  )

  /*
   * GET /api/projects/:id/social-drafts
   */
  router.get(
    "/projects/:id/social-drafts",
    async (request, response) => {
      try {
        const projectId = Number(request.params.id)

        const drafts = await prisma.socialPostDraft.findMany({
          where: {
            projectId,
          },
          orderBy: {
            createdAt: "desc",
          },
        })

        response.json(drafts)
      } catch (error) {
        console.error(error)

        response.status(500).json({
          error: error.message,
        })
      }
    },
  )

  /*
   * PUT /api/social-drafts/:id
   *
   * Käsin tehdyt muokkaukset kuvatekstiin/hashtageihin, tai
   * valittujen tiedostojen päivitys.
   */
  router.put(
    "/social-drafts/:id",
    async (request, response) => {
      try {
        const draftId = Number(request.params.id)

        const { caption, hashtags, selectedFileIds } = request.body || {}

        const updateData = {}

        if (caption !== undefined) {
          updateData.caption = String(caption)
        }

        if (hashtags !== undefined) {
          updateData.hashtags = String(hashtags)
        }

        if (selectedFileIds !== undefined) {
          updateData.selectedFileIds = JSON.stringify(selectedFileIds)
        }

        const draft = await prisma.socialPostDraft.update({
          where: {
            id: draftId,
          },
          data: updateData,
        })

        response.json(draft)
      } catch (error) {
        if (error.code === "P2025") {
          return response.status(404).json({
            error: "Luonnosta ei löytynyt",
          })
        }

        console.error(error)

        response.status(500).json({
          error: error.message,
        })
      }
    },
  )

  /*
   * PUT /api/social-drafts/:id/approve
   *
   * Ihmisen hyväksyntä - ainoa tilasiirtymä joka merkitsee luonnoksen
   * valmiiksi julkaistavaksi (manuaalisesti, ei API-julkaisua).
   */
  router.put(
    "/social-drafts/:id/approve",
    async (request, response) => {
      try {
        const draftId = Number(request.params.id)

        const draft = await prisma.socialPostDraft.update({
          where: {
            id: draftId,
          },
          data: {
            status: "approved",
          },
        })

        response.json(draft)
      } catch (error) {
        if (error.code === "P2025") {
          return response.status(404).json({
            error: "Luonnosta ei löytynyt",
          })
        }

        console.error(error)

        response.status(500).json({
          error: error.message,
        })
      }
    },
  )

  /*
   * PUT /api/social-drafts/:id/publish
   *
   * Julkaisee jo hyväksytyn (status: "approved") luonnoksen
   * Instagramiin Instagram Publisher -pluginin workflow'n kautta.
   */
  router.put(
    "/social-drafts/:id/publish",
    async (request, response) => {
      try {
        const draftId = Number(request.params.id)

        const draft = await prisma.socialPostDraft.findUnique({
          where: {
            id: draftId,
          },
        })

        if (!draft) {
          return response.status(404).json({
            error: "Luonnosta ei löytynyt",
          })
        }

        if (draft.status !== "approved") {
          return response.status(409).json({
            error: `Luonnos ei ole hyväksytty (status: ${draft.status}). Hyväksy luonnos ensin.`,
          })
        }

        const workflowEngine = getSpacemonkeyWorkflowEngine()

        if (!workflowEngine) {
          return response.status(503).json({
            error: "Spacemonkey-moottorit eivät ole vielä käynnistyneet.",
          })
        }

        const toolBus = getSpacemonkeyToolBus()

        const workflowResult = await workflowEngine.execute(
          "publish-instagram-post-workflow",
          {
            draftId,
            prisma,
            toolBus,
          },
        )

        const skillResult = workflowResult.results?.[0]

        if (!skillResult?.success) {
          const failed = await prisma.socialPostDraft.update({
            where: {
              id: draftId,
            },
            data: {
              status: "publish_failed",
              publishError:
                skillResult?.error ||
                "Julkaisu epäonnistui tuntemattomasta syystä.",
            },
          })

          return response.status(422).json({
            error: skillResult?.error,
            code: skillResult?.code,
            draft: failed,
          })
        }

        const published = await prisma.socialPostDraft.update({
          where: {
            id: draftId,
          },
          data: {
            status: "published",
            publishedPostId: skillResult.mediaId,
            publishedPermalink: skillResult.permalink,
            publishedAt: new Date(),
            publishError: null,
          },
        })

        response.json(published)
      } catch (error) {
        console.error(error)

        response.status(500).json({
          error: error.message,
        })
      }
    },
  )

  return router
}
