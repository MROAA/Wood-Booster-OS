import { Component } from "react"

/*
 * Paikallinen virherajaus synteettiselle render-reitille (uusi
 * tiedosto jolla ei vielä ole omaa sivua) - React-virherajaukset
 * vaativat luokkakomponentin, ei hook-vastinetta. Oikealla
 * modify-reitillä ei ole vastaavaa (eikä tänään koko oikeassa
 * sovelluksessakaan ole ylätason virherajausta) - ei siis regressio.
 */
class PreviewErrorBoundary extends Component {

  constructor(props) {

    super(props)

    this.state = { error: null }

  }

  static getDerivedStateFromError(error) {

    return { error }

  }

  render() {

    if (this.state.error) {

      return (

        <div className="p-8 text-sm text-red-400">

          <div className="mb-2 font-medium">Esikatselu kaatui suorituksen aikana</div>

          <pre className="whitespace-pre-wrap font-mono text-xs text-[var(--wood-muted)]">
            {String(this.state.error?.message || this.state.error)}
          </pre>

        </div>

      )

    }

    return this.props.children

  }

}

export default PreviewErrorBoundary
