import {
  Outlet,
  useLocation,
} from "react-router-dom"
import {
  useEffect,
  useState,
} from "react"
import Sidebar from "../components/layout/Sidebar"
import TopBar from "../components/layout/TopBar"
import GlobalSearch from "../components/layout/GlobalSearch"
function OSLayout() {
  const [searchOpen, setSearchOpen] =
    useState(false)
  const location = useLocation()
  // Boosterverse Desktop hallinnoi omaa vieritystään ja haluaa täyttää
  // koko käytettävissä olevan tilan reunasta reunaan (oma tehtäväpalkki,
  // ikkunat jne.) - normaali sivun p-8/overflow-auto rikkoisi sen.
  const isFullBleed = location.pathname === "/desktop"
  useEffect(() => {
    function handleKeyDown(event) {
      if (
        (event.metaKey || event.ctrlKey) &&
        event.key.toLowerCase() === "k"
      ) {
        event.preventDefault()
        setSearchOpen(true)
      }
    }
    window.addEventListener(
      "keydown",
      handleKeyDown,
    )
    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown,
      )
    }
  }, [])
  useEffect(() => {
    // Ilman tätä selain avaa pudotetun tiedoston omana sivunaan aina kun
    // raahaus osuu minkään pudotusalueen ulkopuolelle (esim. sivupalkkiin
    // tai ikkunoiden väliin) - koko sovellus vaihtuisi sen tiedoston
    // näkymäksi. Pudotusalueet (UploadDropzone, työpöydän tausta) pysäyttävät
    // tapahtuman etenemisen omilla preventDefault/stopPropagation-kutsuillaan
    // ennen kuin se ehtii tänne asti, joten tämä toimii vain varmistuksena
    // muualle pudotetuille tiedostoille.
    function preventStrayDrop(event) {
      event.preventDefault()
    }
    window.addEventListener(
      "dragover",
      preventStrayDrop,
    )
    window.addEventListener(
      "drop",
      preventStrayDrop,
    )
    return () => {
      window.removeEventListener(
        "dragover",
        preventStrayDrop,
      )
      window.removeEventListener(
        "drop",
        preventStrayDrop,
      )
    }
  }, [])
  return (
    <div
      className="
        w-screen
        h-screen
        overflow-hidden
        flex
        flex-col
        bg-[var(--wood-bg)]
        text-[var(--wood-text)]
      "
    >
      <TopBar
        onOpenSearch={() =>
          setSearchOpen(true)
        }
      />
      <div
        className="
          flex-1
          flex
          overflow-hidden
        "
      >
        <aside
          className="
            w-[260px]
            shrink-0
            h-full
            overflow-y-auto
            border-r
            border-[var(--wood-border)]
            bg-[var(--wood-panel)]
          "
        >
          <Sidebar />
        </aside>
        <main
          className={
            isFullBleed
              ? "flex-1 h-full overflow-hidden"
              : "flex-1 h-full overflow-auto p-8"
          }
        >
          <Outlet />
        </main>
      </div>
      <GlobalSearch
        open={searchOpen}
        onClose={() =>
          setSearchOpen(false)
        }
      />
    </div>
  )
}
export default OSLayout