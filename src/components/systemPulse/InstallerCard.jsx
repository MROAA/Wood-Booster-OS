function InstallerCard({
    installer
}) {

    if (!installer) {

        return null

    }


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
                Installer Health
            </h2>


            <div
                className="
                    mt-5
                    space-y-3
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
                                "⚠ Degraded"
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
                        Installed
                    </span>

                    <p
                        className="
                            text-lg
                            text-[var(--wood-text)]
                        "
                    >
                        {
                            installer.installed
                                ?
                                "Yes"
                                :
                                "No"
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


            </div>



            <div
                className="
                    mt-5
                    space-y-2
                "
            >

                {
                    Object.entries(
                        installer.checks || {}
                    )
                    .map(
                        ([key, value]) => (

                            <div
                                key={key}
                                className="
                                    flex
                                    justify-between
                                    text-sm
                                "
                            >

                                <span
                                    className="
                                        text-[var(--wood-muted)]
                                    "
                                >
                                    {key}
                                </span>


                                <span
                                    className="
                                        text-[var(--wood-text)]
                                    "
                                >
                                    {
                                        value.exists
                                            ?
                                            "✓"
                                            :
                                            "✗"
                                    }
                                </span>

                            </div>

                        )
                    )

                }

            </div>


        </section>

    )

}


export default InstallerCard
