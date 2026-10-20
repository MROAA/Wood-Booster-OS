import { STUDIO_ROOMS } from "./studioRooms"
import { STUDIO_TOOLS, toolLabel } from "./studioTools"
import { roomTitle, t } from "./studioText"

// Left workspace navigation (PRD §3.1, ~220 px). Every entry opens its
// workspace in a tab (or activates the tab it already has). Collapsed, it
// shows only the runes; the full name stays as the button's label.

function NavButton({ rune, label, active, collapsed, onClick, testId }) {
  return (
    <button
      type="button"
      className={`hws-nav-item ${active ? "is-active" : ""}`}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      title={collapsed ? label : undefined}
      aria-label={collapsed ? label : undefined}
      data-testid={testId}
    >
      <span className="hws-nav-rune" aria-hidden="true">{rune}</span>
      {!collapsed && <span className="hws-nav-label">{label}</span>}
    </button>
  )
}

function WorkspaceNav({ collapsed, activeLocation, homeActive, onHome, onRoom, onTool }) {
  const roomActive = room => !homeActive && activeLocation?.roomId === room.id
  const toolActive = tool => !homeActive && tool.view && activeLocation?.view === tool.view
  return (
    <nav className={`hws-nav ${collapsed ? "is-collapsed" : ""}`} aria-label={t("nav")} data-testid="workspace-nav">
      <NavButton rune="ᚺ" label={t("homeTab")} active={homeActive} collapsed={collapsed} onClick={onHome} testId="nav-home" />
      {!collapsed && <div className="hws-nav-heading">{t("navWorkspaces")}</div>}
      {STUDIO_ROOMS.map(room => (
        <NavButton key={room.id} rune={room.rune} label={roomTitle(room)} active={roomActive(room)} collapsed={collapsed} onClick={() => onRoom(room)} testId={`nav-room-${room.id}`} />
      ))}
      {!collapsed && <div className="hws-nav-heading">{t("navTools")}</div>}
      {STUDIO_TOOLS.map(tool => (
        <NavButton key={tool.id} rune={tool.rune} label={`${toolLabel(tool)}${tool.href ? " ↗" : ""}`} active={toolActive(tool)} collapsed={collapsed} onClick={() => onTool(tool)} testId={`nav-tool-${tool.id}`} />
      ))}
    </nav>
  )
}

export default WorkspaceNav
