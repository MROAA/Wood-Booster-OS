function InstallerCard({
    installer
}) {


    if (!installer) {

        return null

    }



    const runtime =
        installer.runtime?.runtime



    const system =
        installer.systemInfo?.operatingSystem



    const user =
        installer.systemInfo?.user



    const version =
        installer.version?.application



    const manager =
        installer.manager



    return (

        <section
            className="
                card
                p-6
            "
        >


            <h2
                className="
                    text-lg
                    font-medium
                    text-[var(--wood-text)]
                "
            >
                Installer V2
            </h2>



            <div
                className="
                    mt-5
                    space-y-4
                "
            >


                <div>

                    <span
                        className="
                            text-sm
                            text-[var(--wood-muted)]
                        "
                    >
                        Status
                    </span>


                    <p
                        className="
                            text-lg
                            text-[var(--wood-text)]
                        "
                    >
                        {
                            installer.status === "healthy"
                                ?
                                "✓ Healthy"
                                :
                                "⚠ Warning"
                        }
                    </p>

                </div>



                <div>

                    <span
                        className="
                            text-sm
                            text-[var(--wood-muted)]
                        "
                    >
                        Score
                    </span>


                    <p
                        className="
                            text-lg
                            text-[var(--wood-text)]
                        "
                    >
                        {installer.score}%
                    </p>

                </div>



                <div>

                    <span
                        className="
                            text-sm
                            text-[var(--wood-muted)]
                        "
                    >
                        Install Mode
                    </span>


                    <p
                        className="
                            text-[var(--wood-text)]
                        "
                    >
                        {
                            manager?.installation?.packageType
                            ||
                            "-"
                        }
                    </p>

                </div>



                <div>

                    <span
                        className="
                            text-sm
                            text-[var(--wood-muted)]
                        "
                    >
                        Root
                    </span>


                    <p
                        className="
                            text-xs
                            text-[var(--wood-text)]
                        "
                    >
                        {
                            manager?.paths?.root
                            ||
                            "-"
                        }
                    </p>

                </div>



                <div>

                    <span
                        className="
                            text-sm
                            text-[var(--wood-muted)]
                        "
                    >
                        Runtime
                    </span>


                    <p
                        className="
                            text-[var(--wood-text)]
                        "
                    >
                        {
                            runtime?.nodeVersion
                            ||
                            "-"
                        }
                        {" "}
                        /
                        {" "}
                        {
                            runtime?.platform
                            ||
                            "-"
                        }
                    </p>

                </div>



                <div>

                    <span
                        className="
                            text-sm
                            text-[var(--wood-muted)]
                        "
                    >
                        System
                    </span>


                    <p
                        className="
                            text-[var(--wood-text)]
                        "
                    >
                        {
                            system?.type
                            ||
                            "-"
                        }
                        {" "}
                        -
                        {" "}
                        {
                            system?.release
                            ||
                            "-"
                        }
                    </p>

                </div>



                <div>

                    <span
                        className="
                            text-sm
                            text-[var(--wood-muted)]
                        "
                    >
                        User
                    </span>


                    <p
                        className="
                            text-[var(--wood-text)]
                        "
                    >
                        {
                            user?.username
                            ||
                            "-"
                        }
                    </p>

                </div>



                <div>

                    <span
                        className="
                            text-sm
                            text-[var(--wood-muted)]
                        "
                    >
                        Version
                    </span>


                    <p
                        className="
                            text-[var(--wood-text)]
                        "
                    >
                        {
                            version?.name
                            ||
                            "-"
                        }

                        {" "}

                        {
                            version?.version
                            ||
                            "-"
                        }
                    </p>

                </div>


            </div>


        </section>

    )

}


export default InstallerCard
