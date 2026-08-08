/**
 * Wood-Booster HQ
 * Spacemonkey Bootstrap
 *
 * Käynnistää koko järjestelmän oikeassa järjestyksessä.
 */

import SpacemonkeyRuntime from "./SpacemonkeyRuntime.js"

import DevelopmentPack from "../packs/DevelopmentPack.js"
import PythonPack from "../packs/PythonPack.js"
import CppPack from "../packs/CppPack.js"
import GitPack from "../packs/GitPack.js"
import LinuxPack from "../packs/LinuxPack.js"

class Bootstrap {

    constructor({
        logger = console,
    } = {}) {

        this.logger = logger

        this.runtime =
            new SpacemonkeyRuntime({
                logger,
            })

    }

    async start() {

        this.logger.info("")
        this.logger.info("================================")
        this.logger.info("WOOD-BOOSTER OS")
        this.logger.info("Spacemonkey Bootstrap")
        this.logger.info("================================")
        this.logger.info("")

        await this.runtime.start()

        this.logger.info("Loading Capability Packs...")

        this.runtime.capabilityManager.install(
            DevelopmentPack
        )

        this.runtime.capabilityManager.install(
            PythonPack
        )

        this.runtime.capabilityManager.install(
            CppPack
        )

        this.runtime.capabilityManager.install(
            GitPack
        )

        this.runtime.capabilityManager.install(
            LinuxPack
        )

        this.logger.info("")
        this.logger.info("Capability Packs Loaded")
        this.logger.info("")

        this.logger.info(
            this.runtime.status()
        )

        this.logger.info("")
        this.logger.info("Spacemonkey Ready.")
        this.logger.info("")

        return this.runtime

    }

}

export default Bootstrap
