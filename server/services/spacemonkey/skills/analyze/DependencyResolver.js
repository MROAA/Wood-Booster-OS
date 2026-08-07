/**
 * Wood-Booster OS
 * Spacemonkey
 *
 * Dependency Resolver v1
 *
 * Ratkaisee suhteelliset import-polut
 * oikeiksi tiedostopolkuiksi.
 */

import path from "path"
import fs from "fs/promises"


class DependencyResolver {


    constructor({

        logger = console,

    } = {}) {


        this.id =
            "dependency-resolver"


        this.name =
            "Dependency Resolver"


        this.logger =
            logger

    }



    async resolve({

        file,

        imports = [],

    }) {


        const resolved = []


        for (const dependency of imports) {


            if (
                !dependency.startsWith(".")
            ) {

                resolved.push({

                    import:
                        dependency,

                    resolved:
                        false,

                    type:
                        "external",

                })

                continue

            }



            const basePath =
                path.dirname(
                    file
                )



            const target =
                path.resolve(
                    basePath,
                    dependency
                )



            const realFile =
                await this.findFile(
                    target
                )



            resolved.push({

                import:
                    dependency,

                file:
                    realFile,

                resolved:
                    Boolean(realFile),

            })

        }



        return resolved

    }



    async findFile(target) {


        const candidates = [

            target,

            `${target}.js`,

            `${target}.jsx`,

            `${target}.ts`,

            `${target}.tsx`,

            path.join(
                target,
                "index.js"
            ),

        ]



        for (const file of candidates) {


            try {

                await fs.access(
                    file
                )

                return file

            }

            catch {

            }

        }


        return null

    }


}


export default DependencyResolver
