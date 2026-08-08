function InstallerManagerCard({
    manager
}) {


    if(!manager){

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
                Installer Manager
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
                        Mode
                    </span>


                    <p
                        className="
                            text-[var(--wood-text)]
                        "
                    >
                        {
                            manager.installation?.packageType
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
                            manager.applicationVersion
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
                            manager.paths?.root
                            ||
                            "-"
                        }
                    </p>

                </div>



                <div
                    className="
                        flex
                        justify-between
                        text-sm
                    "
                >

                    <span>
                        Frontend
                    </span>


                    <span>
                        {
                            manager.paths?.frontend
                            ?
                            "✓"
                            :
                            "✗"
                        }
                    </span>


                </div>



                <div
                    className="
                        flex
                        justify-between
                        text-sm
                    "
                >

                    <span>
                        Server
                    </span>


                    <span>
                        {
                            manager.paths?.server
                            ?
                            "✓"
                            :
                            "✗"
                        }
                    </span>


                </div>


            </div>


        </section>

    )

}


export default InstallerManagerCard
