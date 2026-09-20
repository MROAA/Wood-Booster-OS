import { useEffect, useRef } from "react"

import { apiGet } from "../../api/client"

const POLL_INTERVAL_MS = 2000

/*
 * Kevyt GET-pollaus /dev-draft-sets/:id:hen approve-plan-pyynnön ollessa
 * lennossa, jotta per-tiedosto-status näkyy elävänä - approve-plan on
 * yksi pitkä, lohkaava HTTP-pyyntö (30-90+s monitiedostosuunnitelmalle),
 * mutta se päivittää jokaisen CodeChangeFileDraft-rivin statuksen
 * tietokantaan matkan varrella, joten rinnakkainen GET näkee edistymisen
 * ennen kuin PUT itse palaa.
 *
 * Käytetään sekä MultiFileChatPanel.jsx:n että ChatPanel.jsx:n omissa,
 * muuten toisistaan riippumattomissa approvePlan-toteutuksissa - sama
 * hook, ei kahta kopiota pollauslogiikasta.
 *
 * Palautetut päivitykset menevät `onProgress`-callbackiin, ei omaan
 * tilaansa, jotta kutsuja päättää itse miten `set` päivittyy omassa
 * turns/messages-listassaan.
 */
export function useApprovePlanProgress() {

  const intervalsRef = useRef({})

  function start(setId, onProgress) {

    stop(setId)

    intervalsRef.current[setId] = setInterval(async () => {

      try {

        const polled = await apiGet(`/dev-draft-sets/${setId}`)

        onProgress(polled)

      } catch {

        // hiljainen - PUT:in oma virheenkäsittely riittää

      }

    }, POLL_INTERVAL_MS)

  }

  function stop(setId) {

    if (intervalsRef.current[setId]) {

      clearInterval(intervalsRef.current[setId])

      delete intervalsRef.current[setId]

    }

  }

  function stopAll() {

    Object.values(intervalsRef.current).forEach(clearInterval)

    intervalsRef.current = {}

  }

  useEffect(() => () => stopAll(), [])

  return { start, stop, stopAll }

}
