import express from "express"

import { generateBlogDraft } from "../services/blogContentGenerator.js"

import {
  getSpacemonkeyToolBus,
  getSpacemonkeyWorkflowEngine,
} from "../services/spacemonkey/spacemonkeyRuntimeBootstrap.js"

export default function createWordpressStudioRouter(prisma) {
  const router = express.Router()

  /*
   * POST /api/projects/:id/blog-drafts
   *
   * Luo uuden blogiluonnoksen - joko AI:n avulla (useAI: true) tai
   * käsin annetusta otsikosta/sisällöstä. Ei koskaan julkaise
   * mitään automaattisesti - luonnos jää odottamaan ihmisen
   * tarkistusta.
   */
  router.post(
    "/projects/:id/blog-drafts",
    async (request, response) => {
      try {
        const projectId = Number(request.params.id)

        const { useAI, title, content, excerpt, wordpressPostStatus } =
          request.body || {}

        let draftTitle = title
        let draftContent = content

        if (useAI) {
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

          const generated = await generateBlogDraft({
            project,
          })

          draftTitle = generated.title
          draftContent = generated.content
        }

        if (!draftTitle || !draftContent) {
          return response.status(400).json({
            error: "Otsikko ja sisältö vaaditaan, tai käytä useAI:true",
          })
        }

        const draft = await prisma.blogPostDraft.create({
          data: {
            projectId,
            title: draftTitle,
            content: draftContent,
            excerpt: excerpt || null,
            wordpressPostStatus: wordpressPostStatus || "publish",
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
   * GET /api/projects/:id/blog-drafts
   */
  router.get(
    "/projects/:id/blog-drafts",
    async (request, response) => {
      try {
        const projectId = Number(request.params.id)

        const drafts = await prisma.blogPostDraft.findMany({
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
   * PUT /api/blog-drafts/:id
   *
   * Käsin tehdyt muokkaukset otsikkoon/sisältöön/otteeseen, tai
   * WordPress-julkaisutilan (publish/draft/future) päivitys.
   */
  router.put(
    "/blog-drafts/:id",
    async (request, response) => {
      try {
        const draftId = Number(request.params.id)

        const { title, content, excerpt, wordpressPostStatus } =
          request.body || {}

        const updateData = {}

        if (title !== undefined) {
          updateData.title = String(title)
        }

        if (content !== undefined) {
          updateData.content = String(content)
        }

        if (excerpt !== undefined) {
          updateData.excerpt = excerpt ? String(excerpt) : null
        }

        if (wordpressPostStatus !== undefined) {
          updateData.wordpressPostStatus = String(wordpressPostStatus)
        }

        const draft = await prisma.blogPostDraft.update({
          where: {
            id: draftId,
          },
          data: updateData,
        })

        response.json(draft)
      } catch (error) {
        console.error(error)

        response.status(500).json({
          error: error.message,
        })
      }
    },
  )

  /*
   * PUT /api/blog-drafts/:id/approve
   *
   * Ihmisen hyväksyntä - ainoa tilasiirtymä joka merkitsee luonnoksen
   * valmiiksi julkaistavaksi.
   */
  router.put(
    "/blog-drafts/:id/approve",
    async (request, response) => {
      try {
        const draftId = Number(request.params.id)

        const draft = await prisma.blogPostDraft.update({
          where: {
            id: draftId,
          },
          data: {
            status: "approved",
          },
        })

        response.json(draft)
      } catch (error) {
        console.error(error)

        response.status(500).json({
          error: error.message,
        })
      }
    },
  )

  /*
   * PUT /api/blog-drafts/:id/publish
   *
   * Julkaisee jo hyväksytyn (status: "approved") luonnoksen
   * WordPressiin WordPress Publisher -pluginin workflow'n kautta.
   */
  router.put(
    "/blog-drafts/:id/publish",
    async (request, response) => {
      try {
        const draftId = Number(request.params.id)

        const draft = await prisma.blogPostDraft.findUnique({
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
          "publish-wordpress-post-workflow",
          {
            draftId,
            prisma,
            toolBus,
          },
        )

        const skillResult = workflowResult.results?.[0]

        if (!skillResult?.success) {
          const failed = await prisma.blogPostDraft.update({
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

        const published = await prisma.blogPostDraft.update({
          where: {
            id: draftId,
          },
          data: {
            status: "published",
            wordpressPostId: String(skillResult.postId),
            wordpressPermalink: skillResult.permalink,
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
