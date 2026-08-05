import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

import express from "express"
import multer from "multer"

const router = express.Router()

const currentFile = fileURLToPath(import.meta.url)
const currentDirectory = path.dirname(currentFile)

const uploadsRoot = path.resolve(
  currentDirectory,
  "../uploads/business",
)

fs.mkdirSync(uploadsRoot, {
  recursive: true,
})

const storage = multer.diskStorage({
  destination(req, file, callback) {
    callback(null, uploadsRoot)
  },

  filename(req, file, callback) {
    const safeName = file.originalname
      .replace(/[^a-zA-Z0-9._-]/g, "_")

    const storedName = `${Date.now()}-${safeName}`

    callback(null, storedName)
  },
})

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
})

const DEFAULT_SETTINGS = {
  id: null,
  companyName: null,
  streetAddress: null,
  postalCode: null,
  city: null,
  businessId: null,
  phone: null,
  email: null,
  website: null,
  iban: null,
  logoOriginalName: null,
  logoStoredName: null,
  logoMimeType: null,
  vatPercent: 25.5,
  defaultPaymentTerms: "14 pv netto",
  defaultValidDays: 14,
  quoteNumberPrefix: "WB-Q",
  invoiceNumberPrefix: "WB-L",
  defaultInvoiceDueDays: 14,
}

export default function createBusinessSettingsRouter(prisma) {
  router.get(
    "/business-settings",
    async (req, res) => {
      try {
        const settings =
          await prisma.businessSettings.findUnique({
            where: {
              id: 1,
            },
          })

        res.json(settings || DEFAULT_SETTINGS)
      } catch (error) {
        console.error(error)

        res.status(500).json({
          error:
            error.message ||
            "Asetusten lataaminen epäonnistui",
        })
      }
    },
  )

  router.put(
    "/business-settings",
    async (req, res) => {
      try {
        const data = {}

        const nullableStringFields = [
          "companyName",
          "streetAddress",
          "postalCode",
          "city",
          "businessId",
          "phone",
          "email",
          "website",
          "iban",
        ]

        for (const field of nullableStringFields) {
          if (req.body[field] !== undefined) {
            data[field] =
              req.body[field]
                ? String(req.body[field]).trim()
                : null
          }
        }

        const requiredStringFields = [
          [
            "defaultPaymentTerms",
            "Maksuehdot eivät voi olla tyhjät",
          ],
          [
            "quoteNumberPrefix",
            "Tarjousnumeroinnin etuliite ei voi olla tyhjä",
          ],
          [
            "invoiceNumberPrefix",
            "Laskunumeroinnin etuliite ei voi olla tyhjä",
          ],
        ]

        for (const [
          field,
          errorMessage,
        ] of requiredStringFields) {
          if (req.body[field] !== undefined) {
            const value =
              String(req.body[field]).trim()

            if (!value) {
              return res.status(400).json({
                error: errorMessage,
              })
            }

            data[field] = value
          }
        }

        if (req.body.vatPercent !== undefined) {
          const vatPercent = Number(req.body.vatPercent)

          if (
            !Number.isFinite(vatPercent) ||
            vatPercent < 0 ||
            vatPercent > 100
          ) {
            return res.status(400).json({
              error: "Virheellinen ALV-prosentti",
            })
          }

          data.vatPercent = vatPercent
        }

        if (req.body.defaultValidDays !== undefined) {
          const defaultValidDays =
            Number(req.body.defaultValidDays)

          if (
            !Number.isInteger(defaultValidDays) ||
            defaultValidDays <= 0
          ) {
            return res.status(400).json({
              error:
                "Virheellinen voimassaoloaika",
            })
          }

          data.defaultValidDays = defaultValidDays
        }

        if (req.body.defaultInvoiceDueDays !== undefined) {
          const defaultInvoiceDueDays =
            Number(req.body.defaultInvoiceDueDays)

          if (
            !Number.isInteger(defaultInvoiceDueDays) ||
            defaultInvoiceDueDays <= 0
          ) {
            return res.status(400).json({
              error:
                "Virheellinen eräpäivän oletusarvo",
            })
          }

          data.defaultInvoiceDueDays = defaultInvoiceDueDays
        }

        const settings =
          await prisma.businessSettings.upsert({
            where: {
              id: 1,
            },

            update: data,

            create: {
              ...DEFAULT_SETTINGS,
              ...data,
              id: 1,
            },
          })

        res.json(settings)
      } catch (error) {
        console.error(error)

        res.status(500).json({
          error:
            error.message ||
            "Asetusten tallentaminen epäonnistui",
        })
      }
    },
  )

  router.post(
    "/business-settings/logo",
    upload.single("file"),
    async (req, res) => {
      try {
        if (!req.file) {
          return res.status(400).json({
            error: "Tiedosto puuttuu",
          })
        }

        const existing =
          await prisma.businessSettings.findUnique({
            where: {
              id: 1,
            },
          })

        if (existing?.logoStoredName) {
          fs.rmSync(
            path.join(
              uploadsRoot,
              existing.logoStoredName,
            ),
            {
              force: true,
            },
          )
        }

        const logoData = {
          logoOriginalName: req.file.originalname,
          logoStoredName: req.file.filename,
          logoMimeType: req.file.mimetype,
        }

        const settings =
          await prisma.businessSettings.upsert({
            where: {
              id: 1,
            },

            update: logoData,

            create: {
              ...DEFAULT_SETTINGS,
              ...logoData,
              id: 1,
            },
          })

        res.status(201).json(settings)
      } catch (error) {
        console.error(error)

        if (req.file?.path) {
          fs.rmSync(req.file.path, {
            force: true,
          })
        }

        res.status(500).json({
          error:
            error.message ||
            "Logon lataaminen epäonnistui",
        })
      }
    },
  )

  router.delete(
    "/business-settings/logo",
    async (req, res) => {
      try {
        const existing =
          await prisma.businessSettings.findUnique({
            where: {
              id: 1,
            },
          })

        if (!existing?.logoStoredName) {
          return res.json(
            existing || DEFAULT_SETTINGS,
          )
        }

        fs.rmSync(
          path.join(
            uploadsRoot,
            existing.logoStoredName,
          ),
          {
            force: true,
          },
        )

        const settings =
          await prisma.businessSettings.update({
            where: {
              id: 1,
            },

            data: {
              logoOriginalName: null,
              logoStoredName: null,
              logoMimeType: null,
            },
          })

        res.json(settings)
      } catch (error) {
        console.error(error)

        res.status(500).json({
          error:
            error.message ||
            "Logon poistaminen epäonnistui",
        })
      }
    },
  )

  return router
}
