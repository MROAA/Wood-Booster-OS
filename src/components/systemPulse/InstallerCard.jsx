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



const dependencies =
    installer.dependencies



const report =
    installer.report



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
    Installer Status
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
    "✓ READY"
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
    Installation Score
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
    Report
</span>

<p
    className="
        text-[var(--wood-text)]
    "
>
{
    report?.recommendation
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

{" / "}

{
    runtime?.platform
    ||
    "-"
}

{" / "}

{
    runtime?.architecture
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



<div>

<span
    className="
        text-sm
        text-[var(--wood-muted)]
    "
>
    Dependencies
</span>

<p
    className="
        text-[var(--wood-text)]
    "
>
{
    dependencies?.score
    ||
    0
}%
</p>

</div>



<div
    className="
        mt-3
        space-y-2
    "
>

{
Object.entries(
    dependencies?.checks || {}
)
.map(
([key,value]) => (

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


</div>


</section>

)

}


export default InstallerCard
