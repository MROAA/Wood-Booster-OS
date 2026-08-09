import {
  Outlet,
} from "react-router-dom"
import {
  useEffect,
  useState,
} from "react"
import Sidebar from "../components/layout/Sidebar"
import TopBar from "../components/layout/TopBar"
import GlobalSearch from "../components/layout/GlobalSearch"
import SpacemonkeyDrawer from "../components/ai/SpacemonkeyDrawer"
function OSLayout() {
  const [searchOpen, setSearchOpen] =
    useState(false)
  const [chatOpen, setChatOpen] =
    useState(false)
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
          <Sidebar
            onOpenChat={() =>
              setChatOpen(true)
            }
          />
        </aside>
        <main
          className="
            flex-1
            h-full
            overflow-auto
            p-8
          "
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
      <SpacemonkeyDrawer
        open={chatOpen}
        onClose={() =>
          setChatOpen(false)
        }
      />
    </div>
  )
}
export default OSLayout