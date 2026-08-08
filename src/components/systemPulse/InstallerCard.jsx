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



const recovery =
    installer.recovery



const snapshots =
    installer.snapshots



const snapshotHistory =
    installer.snapshotHistory



const latestSnapshot =
    snapshotHistory?.latest



const latestMetadata =
    latestSnapshot?.metadata



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
    Installer V3
</h2>



<div
    className="
        mt-5
        space-y-4
    "
>


<div>
<span className="text-sm text-[var(--wood-muted)]">
Status
</span>

<p className="text-lg text-[var(--wood-text)]">
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
<span className="text-sm text-[var(--wood-muted)]">
Score
</span>

<p className="text-lg text-[var(--wood-text)]">
{installer.score}%
</p>
</div>



<div>
<span className="text-sm text-[var(--wood-muted)]">
Report
</span>

<p className="text-[var(--wood-text)]">
{
    report?.status
    ||
    "-"
}
</p>
</div>



<div>
<span className="text-sm text-[var(--wood-muted)]">
Recovery
</span>

<p className="text-[var(--wood-text)]">
{
    recovery?.status
    ||
    "-"
}
</p>

<p className="text-sm text-[var(--wood-text)]">
Score {recovery?.score ?? 0}%
</p>
</div>



<div>
<span className="text-sm text-[var(--wood-muted)]">
Snapshots
</span>

<p className="text-[var(--wood-text)]">
{
    snapshots?.status
    ||
    "-"
}
</p>

<p className="text-[var(--wood-text)]">
Count {snapshots?.count ?? 0}
</p>
</div>



<div>
<span className="text-sm text-[var(--wood-muted)]">
Snapshot History
</span>

<p className="text-[var(--wood-text)]">
{
    snapshotHistory?.status
    ||
    "-"
}
</p>

<p className="text-[var(--wood-text)]">
Total {snapshotHistory?.count ?? 0}
</p>

<p className="text-xs text-[var(--wood-text)]">
{
    latestSnapshot?.id
    ||
    "-"
}
</p>

</div>



<div>
<span className="text-sm text-[var(--wood-muted)]">
Created
</span>

<p className="text-xs text-[var(--wood-text)]">
{
    latestMetadata?.createdAt
    ||
    "-"
}
</p>
</div>



<div>
<span className="text-sm text-[var(--wood-muted)]">
Install Mode
</span>

<p className="text-[var(--wood-text)]">
{
    manager?.installation?.packageType
    ||
    "-"
}
</p>
</div>



<div>
<span className="text-sm text-[var(--wood-muted)]">
Runtime
</span>

<p className="text-[var(--wood-text)]">
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
<span className="text-sm text-[var(--wood-muted)]">
System
</span>

<p className="text-[var(--wood-text)]">
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
<span className="text-sm text-[var(--wood-muted)]">
User
</span>

<p className="text-[var(--wood-text)]">
{
    user?.username
    ||
    "-"
}
</p>
</div>



<div>
<span className="text-sm text-[var(--wood-muted)]">
Version
</span>

<p className="text-[var(--wood-text)]">
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

<span className="text-sm text-[var(--wood-muted)]">
Dependencies
</span>

<p className="text-[var(--wood-text)]">
{
    dependencies?.score
    ??
    0
}%
</p>


<div
className="
mt-2
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

<span className="text-[var(--wood-muted)]">
{key}
</span>

<span className="text-[var(--wood-text)]">
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


</div>


</section>

)

}


export default InstallerCard
