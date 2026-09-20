import { useEffect, useRef, useState } from "react"

/*
 * Palauttaa kuluneet sekunnit siitä hetkestä kun `active` muuttuu
 * todeksi, tikittäen kerran sekunnissa - puhtaasti asiakaspään laskuri,
 * ei taustapalvelinmuutoksia. Nollautuu joka kerta kun `active` menee
 * takaisin epätodeksi. Käytetään paikoissa joissa ei ole mitään
 * väli-DB-riviä pollattavaksi (ks. useApprovePlanProgress.js sille
 * ainoalle paikalle jossa oikeaa väliaikaista dataa on).
 */
export function useElapsedSeconds(active) {

  const [seconds, setSeconds] = useState(0)

  const startRef = useRef(null)

  useEffect(() => {

    if (!active) {

      setSeconds(0)

      startRef.current = null

      return

    }

    startRef.current = Date.now()

    setSeconds(0)

    const intervalId = setInterval(() => {

      setSeconds(Math.floor((Date.now() - startRef.current) / 1000))

    }, 1000)

    return () => clearInterval(intervalId)

  }, [active])

  return seconds

}
