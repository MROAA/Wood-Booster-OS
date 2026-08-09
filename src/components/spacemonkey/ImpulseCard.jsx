import { useState } from "react"

import { apiPost } from "../../api/client"


function ImpulseCard() {

  const [topic, setTopic] = useState("")

  const [result, setResult] = useState(null)

  const [loading, setLoading] = useState(false)

  const [error, setError] = useState("")


  async function requestImpulse() {

    setLoading(true)
    setError("")

    try {

      const response = await apiPost(
        "/spacemonkey/impulse",
        topic.trim() ? { topic: topic.trim() } : {},
      )

      if (response.success) {
        setResult(response.data)
      } else {
        setError(
          response.error ||
          "Impulssin pyytäminen epäonnistui.",
        )
      }

    }

    catch (requestError) {

      setError(
        requestError.message ||
        "Impulssin pyytäminen epäonnistui.",
      )

    }

    finally {

      setLoading(false)

    }

  }


  return (

    <section
      className="
        card
        p-6
        wood-hover
      "
    >

      <h2
        className="
          text-sm
          uppercase
          tracking-widest
          text-[var(--wood-muted)]
        "
      >
        ⚡ Impulse
      </h2>

      <p
        className="
          mt-2
          text-sm
          text-[var(--wood-muted)]
        "
      >
        Pyydä Spacemonkeylta rohkea idea tai arkkitehtuurikritiikki.
        Jätä aihe tyhjäksi, niin se valitsee itse mistä puhua.
      </p>

      <div
        className="
          mt-4
          flex
          gap-2
        "
      >

        <input
          type="text"
          value={topic}
          onChange={(event) => setTopic(event.target.value)}
          placeholder="Aihe (valinnainen)"
          disabled={loading}
          className="
            flex-1
            bg-[var(--wood-panel)]
            border
            border-[var(--wood-border)]
            rounded-lg
            px-4
            py-2.5
            text-sm
            focus:outline-none
            disabled:opacity-50
          "
        />

        <button
          type="button"
          onClick={requestImpulse}
          disabled={loading}
          className="
            bg-[var(--wood-accent)]
            text-black
            font-medium
            px-5
            py-2.5
            rounded-lg
            text-sm
            disabled:opacity-50
          "
        >
          {loading ? "Ajattelee…" : "Pyydä idea"}
        </button>

      </div>

      {
        error && (

          <p
            className="
              mt-4
              text-sm
              text-red-400
            "
          >
            {error}
          </p>

        )
      }

      {
        result && (

          <div
            className="
              mt-5
              space-y-2
            "
          >

            <p
              className="
                text-xs
                uppercase
                tracking-widest
                text-[var(--wood-muted)]
              "
            >
              {
                result.autonomous
                  ? "Spacemonkey valitsi itse: "
                  : "Aihe: "
              }
              {result.topic}
            </p>

            <p
              className="
                text-sm
                whitespace-pre-wrap
              "
            >
              {result.impulse}
            </p>

          </div>

        )
      }

    </section>

  )

}


export default ImpulseCard
