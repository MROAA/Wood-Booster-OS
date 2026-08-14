import {
  createContext,
  useContext,
  useState,
} from "react"


import VirtualWorkspacePanel from "../components/workspace/VirtualWorkspacePanel.jsx"
import TerminalApp from "../components/desktop/TerminalApp.jsx"
import CalculatorApp from "../components/desktop/CalculatorApp.jsx"
import NotepadApp from "../components/desktop/NotepadApp.jsx"
import VerificationResultViewer from "../components/desktop/VerificationResultViewer.jsx"
import Projects from "../pages/Projects.jsx"
import Settings from "../pages/Settings.jsx"
import SystemPulse from "../pages/SystemPulse.jsx"
import SpacemonkeyChat from "../pages/SpacemonkeyChat.jsx"
import Knowledge from "../pages/Knowledge.jsx"
import KnowledgeUpload from "../pages/KnowledgeUpload.jsx"
import Memory from "../pages/Memory.jsx"
import SpacemonkeyBrain from "../pages/SpacemonkeyBrain.jsx"
import Tools from "../pages/Tools.jsx"
import DevStudio from "../pages/DevStudio.jsx"
import ProjectWorkspace from "../pages/ProjectWorkspace.jsx"
import SpiderSolitaire from "../pages/SpiderSolitaire.jsx"
import AIGenerator from "../pages/AIGenerator.jsx"
import GitGuardianCard from "../components/systemPulse/GitGuardianCard.jsx"


/*
 * Sovelluskuvakerekisteri ja ikkunatila siirrettiin tänne
 * BoosterverseDesktop.jsx:stä (ks. sen kommentti), jotta myös
 * työpöydän ulkopuolella (esim. syvällä sisäkkäin olevassa
 * DevChatPanel.jsx:ssä) toimiva komponentti voi pyytää uuden ikkunan
 * avaamista ilman propsien läpivientiä joka tasolla - sama
 * Context-malli kuin AIContext.jsx:llä ja ChatContext.jsx:llä, jotka
 * on jo kiinnitetty koko sovelluksen yläpuolelle main.jsx:ssä.
 */
export const APPS = {
  explorer: { title: "Tiedostonhallinta", icon: "📁", component: VirtualWorkspacePanel, defaultWidth: 820, defaultHeight: 600 },
  terminal: { title: "Pääte (fish)", icon: "💻", component: TerminalApp, defaultWidth: 760, defaultHeight: 500 },
  projects: { title: "Projektit", icon: "📁", component: Projects, defaultWidth: 800, defaultHeight: 560 },
  spacemonkey: { title: "Spacemonkey", icon: "🐒", component: SpacemonkeyChat, defaultWidth: 520, defaultHeight: 600 },
  systempulse: { title: "System Pulse", icon: "🧠", component: SystemPulse, defaultWidth: 700, defaultHeight: 650 },
  gitguardian: { title: "Git Guardian", icon: "🛡", component: GitGuardianCard, defaultWidth: 480, defaultHeight: 520 },
  knowledge: { title: "Knowledge", icon: "◌", component: Knowledge, defaultWidth: 820, defaultHeight: 620 },
  knowledgeupload: { title: "Tiedostojen lataus", icon: "📥", component: KnowledgeUpload, defaultWidth: 560, defaultHeight: 520 },
  memory: { title: "Memory", icon: "◈", component: Memory, defaultWidth: 780, defaultHeight: 620 },
  spacemonkeybrain: { title: "Spacemonkey Brain", icon: "⬡", component: SpacemonkeyBrain, defaultWidth: 660, defaultHeight: 560 },
  tools: { title: "Tools", icon: "▨", component: Tools, defaultWidth: 820, defaultHeight: 620 },
  devstudio: { title: "Dev Studio", icon: "λ", component: DevStudio, defaultWidth: 900, defaultHeight: 650 },
  projectworkspace: { title: "Projektityötila", icon: "🗂", component: ProjectWorkspace, defaultWidth: 920, defaultHeight: 600 },
  spidersolitaire: { title: "Spider-pasianssi", icon: "♤", component: SpiderSolitaire, defaultWidth: 900, defaultHeight: 650 },
  aigenerator: { title: "AI Generator", icon: "✦", component: AIGenerator, defaultWidth: 620, defaultHeight: 640 },
  devverificationviewer: { title: "Tarkistustulos", icon: "🧪", component: VerificationResultViewer, defaultWidth: 700, defaultHeight: 600 },
  settings: { title: "Asetukset", icon: "⚙", component: Settings, defaultWidth: 700, defaultHeight: 600 },
  calculator: { title: "Laskin", icon: "🧮", component: CalculatorApp, defaultWidth: 320, defaultHeight: 480 },
  notepad: { title: "Muistio", icon: "📝", component: NotepadApp, defaultWidth: 520, defaultHeight: 480 },
}


function createWindow(app, zIndex, props) {
  return {
    id: `${app}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    app,
    title: APPS[app].title,
    icon: APPS[app].icon,
    x: 140 + Math.round(Math.random() * 60),
    y: 90 + Math.round(Math.random() * 40),
    width: APPS[app].defaultWidth,
    height: APPS[app].defaultHeight,
    zIndex,
    minimized: false,
    maximized: false,
    props: props || {},
  }
}



const DesktopContext =
  createContext(null)



export function DesktopProvider({

  children

}) {


  const [
    windows,
    setWindows,
  ] = useState(
    () => []
  )


  const [
    nextZ,
    setNextZ,
  ] = useState(1)


  const [
    startOpen,
    setStartOpen,
  ] = useState(false)


  const [
    search,
    setSearch,
  ] = useState("")


  // Tosi vain kun BoosterverseDesktop on oikeasti kiinnitetty
  // (rekisteröityy itse mount/unmount-efektissään) - erottaa
  // /desktop-reitin siitä ettei esim. /dev-studio-suoran reitin
  // kautta yritetä avata ikkunaa näkymään, jota ei ole olemassa.
  const [
    isDesktopActive,
    setIsDesktopActive,
  ] = useState(false)


  function focusWindow(id) {
    setWindows(previous => previous.map(w => (w.id === id ? { ...w, zIndex: nextZ, minimized: false } : w)))
    setNextZ(z => z + 1)
  }


  function moveWindow(id, x, y) {
    setWindows(previous => previous.map(w => (w.id === id ? { ...w, x, y } : w)))
  }


  function resizeWindow(id, width, height) {
    setWindows(previous => previous.map(w => (w.id === id ? { ...w, width, height } : w)))
  }


  function closeWindow(id) {
    setWindows(previous => previous.filter(w => w.id !== id))
  }


  function minimizeWindow(id) {
    setWindows(previous => previous.map(w => (w.id === id ? { ...w, minimized: true } : w)))
  }


  function maximizeWindow(id) {
    setWindows(previous => previous.map(w => (w.id === id ? { ...w, maximized: !w.maximized } : w)))
  }


  function minimizeAll() {
    setWindows(previous => previous.map(w => ({ ...w, minimized: true })))
    setStartOpen(false)
  }


  /*
   * options.props / options.forceNew ovat uusia - ilman niitä
   * (kaikki nykyiset ~20 kutsupaikkaa) käytös on täsmälleen
   * ennallaan: sama sovellus-id fokusoi olemassa olevan ikkunan sen
   * sijaan että avaisi uuden. Kun props/forceNew annetaan (esim.
   * DevChatPanel avaa tarkistustulos-ikkunan), uusi ikkuna luodaan
   * aina - näin useampi tulosikkuna voi olla auki yhtä aikaa ilman
   * että se sotkee minkään olemassa olevan sovelluksen
   * yhden-ikkunan-kerrallaan-käytöstä.
   */
  function openApp(app, options = {}) {

    const { props, forceNew } = options

    setStartOpen(false)

    setSearch("")

    if (!forceNew && !props) {

      const existing = windows.find(w => w.app === app)

      if (existing) {
        focusWindow(existing.id)
        return
      }

    }

    setWindows(previous => [...previous, createWindow(app, nextZ, props)])

    setNextZ(z => z + 1)

  }


  return (

    <DesktopContext.Provider

      value={{

        windows,

        nextZ,

        startOpen,

        setStartOpen,

        search,

        setSearch,

        isDesktopActive,

        setIsDesktopActive,

        openApp,

        focusWindow,

        moveWindow,

        resizeWindow,

        closeWindow,

        minimizeWindow,

        maximizeWindow,

        minimizeAll,

      }}

    >

      {children}

    </DesktopContext.Provider>

  )


}



export function useDesktop() {


  const context =
    useContext(
      DesktopContext
    )


  if (!context) {


    throw new Error(

      "useDesktop must be used inside DesktopProvider"

    )


  }


  return context


}
