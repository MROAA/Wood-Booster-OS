/**
 * Wood-Booster HQ
 * Boosterverse
 *
 * HQ Atlas Tool
 *
 * Project Atlas: mitä HQ:ssa on rakennettu, laskettuna todisteista
 * (inventory/systemAtlas.js). Vain luku: lukee koodia ja git-tilaa, ei
 * muuta mitään. Projektijuuri tulee ToolBusin runtime-argumenttina.
 */

import { buildSystemAtlas } from "../../../inventory/systemAtlas.js"

const atlasTool = {

    id: "hq-atlas",

    name: "HQ Project Atlas (read-only)",

    description:
        "Builds the HQ system map from evidence: code present, loaded by " +
        "the server or the app, on the stable branch or other branches, " +
        "test files found. Read-only.",

    readOnly: true,

    async execute(input = {}, runtime = null) {

        if (!runtime?.root) {
            return {
                success: false,
                code: "root_missing",
                error: "Projektijuuri puuttuu.",
            }
        }

        try {
            return {
                success: true,
                atlas: await buildSystemAtlas({ root: runtime.root }),
            }
        } catch (error) {
            return {
                success: false,
                code: "atlas_failed",
                error: error.message,
            }
        }

    },

}

export default atlasTool
