import { useEffect, useState } from "react"

import { apiGet } from "../api/client"

import EntityBrowser from "../components/hearthwood-studio/EntityBrowser"
import EntityChangeLog from "../components/hearthwood-studio/EntityChangeLog"
import EntityFieldEditor from "../components/hearthwood-studio/EntityFieldEditor"
import NlChangeBox from "../components/hearthwood-studio/NlChangeBox"
import LivePreviewPane from "../components/hearthwood-studio/LivePreviewPane"
import PatchHistoryList from "../components/hearthwood-studio/PatchHistoryList"

/*
 * Hearthwood Studio - oma Dev Studio pelille, ei pilleri geneerisellä
 * /dev-studio:lla (Marc 2026-08-30: "luot pelille dev studion
 * patchbaysta"). Vaiheen 1 MVP: entiteettiselain + "omin sanoin"
 * -laatikko + live-esikatselu + historia. Kenttäeditori ja
 * tasapaino/doctor-paneelit ovat Vaiheen 2 laajennuksia
 * (heartwood-patchbay-vast-giraffe.md), ei tässä.
 */
function HearthwoodStudio() {
  const [entityType, setEntityType] = useState("enemies")
  const [entityId, setEntityId] = useState(null)
  const [entityDetail, setEntityDetail] = useState(null)
  const [entityLoading, setEntityLoading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [historyKey, setHistoryKey] = useState(0)

  useEffect(() => {
    if (!entityId) {
      setEntityDetail(null)
      return
    }

    let cancelled = false

    async function load() {
      setEntityLoading(true)

      try {
        const data = await apiGet(`/hearthwood-patchbay/entity/${entityType}/${entityId}`)

        if (!cancelled) {
          setEntityDetail(data)
        }
      } catch {
        if (!cancelled) {
          setEntityDetail(null)
        }
      } finally {
        if (!cancelled) {
          setEntityLoading(false)
        }
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [entityType, entityId])

  function handleTypeChange(nextType) {
    setEntityType(nextType)
    setEntityId(null)
    setPreviewUrl(null)
  }

  function handleSelect(type, id) {
    setEntityType(type)
    setEntityId(id)
    setPreviewUrl(null)
  }

  function handleApplied() {
    setReloadKey(previous => previous + 1)
    setHistoryKey(previous => previous + 1)
  }

  function handleReverted() {
    setReloadKey(previous => previous + 1)
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[var(--wood-accent)]">
          Boosterverse
        </p>

        <h1 className="mt-2 text-4xl font-bold text-[var(--wood-text)]">
          🜏 Hearthwood Studio
        </h1>

        <p className="mt-3 max-w-3xl text-[var(--wood-muted)]">
          Selaa pelin sisältöä, kerro suomeksi mitä haluat muuttaa, tarkista ehdotus ja diffi,
          ja sovella vasta hyväksynnän jälkeen. Jokainen muutos on yhden napin päässä peruutettavista.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[260px_1fr_360px]">
        <section className="h-[620px] rounded-2xl border border-[var(--wood-border)] bg-[var(--wood-panel)] overflow-hidden">
          <EntityBrowser
            type={entityType}
            onTypeChange={handleTypeChange}
            selectedId={entityId}
            onSelect={handleSelect}
          />
        </section>

        <section className="h-[620px] rounded-2xl border border-[var(--wood-border)] bg-[var(--wood-panel)] overflow-y-auto wood-scroll p-5 space-y-4">
          {
            !entityId && (
              <div className="text-sm text-[var(--wood-muted)]">
                Valitse entiteetti vasemmalta aloittaaksesi.
              </div>
            )
          }

          {
            entityId && entityLoading && (
              <div className="text-sm text-[var(--wood-muted)]">Ladataan...</div>
            )
          }

          {
            entityId && entityDetail && (
              <div className="rounded-xl border border-[var(--wood-border)] bg-[var(--wood-bg)] p-3 space-y-3">
                <div className="text-sm font-semibold text-[var(--wood-text)]">
                  {entityDetail.name || entityDetail.id}
                </div>

                <EntityFieldEditor
                  type={entityType}
                  entityId={entityId}
                  entityDetail={entityDetail}
                  onApplied={handleApplied}
                  onPreviewUrlChange={setPreviewUrl}
                />
              </div>
            )
          }

          {
            entityId && !entityLoading && (
              <EntityChangeLog entityId={entityId} reloadKey={reloadKey} />
            )
          }

          <NlChangeBox
            type={entityType}
            entityId={entityId}
            entityLabel={entityDetail?.name}
            onApplied={handleApplied}
            onPreviewUrlChange={setPreviewUrl}
          />
        </section>

        <section className="h-[620px] rounded-2xl border border-[var(--wood-border)] bg-[var(--wood-panel)] overflow-hidden">
          <LivePreviewPane previewUrl={previewUrl} reloadKey={reloadKey} />
        </section>
      </div>

      <section className="rounded-2xl border border-[var(--wood-border)] bg-[var(--wood-panel)] overflow-hidden">
        <div className="border-b border-[var(--wood-border)] px-5 py-3 text-sm font-semibold text-[var(--wood-text)]">
          Historia
        </div>

        <div className="h-[420px]">
          <PatchHistoryList reloadKey={historyKey} onReverted={handleReverted} />
        </div>
      </section>
    </div>
  )
}

export default HearthwoodStudio
