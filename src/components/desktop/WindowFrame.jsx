function startDrag(e, onDelta) {
  const startX = e.clientX;
  const startY = e.clientY;

  function handleMouseMove(moveEvent) {
    onDelta(moveEvent.clientX - startX, moveEvent.clientY - startY);
  }
  function handleMouseUp() {
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  }
  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', handleMouseUp);
}

export default function WindowFrame({ win, onFocus, onMove, onResize, onClose, onMinimize, onMaximize, children }) {
  if (win.minimized) return null;

  const originX = win.x;
  const originY = win.y;
  const originW = win.width;
  const originH = win.height;

  function handleTitleMouseDown(e) {
    if (win.maximized) return;
    onFocus();
    startDrag(e, (dx, dy) => onMove(originX + dx, originY + dy));
  }

  function handleResizeMouseDown(e) {
    e.stopPropagation();
    onFocus();
    startDrag(e, (dx, dy) => onResize(Math.max(360, originW + dx), Math.max(240, originH + dy)));
  }

  return (
    <div
      className={`win-window ${win.maximized ? 'maximized' : ''}`}
      style={
        win.maximized
          ? { zIndex: win.zIndex }
          : { left: win.x, top: win.y, width: win.width, height: win.height, zIndex: win.zIndex }
      }
      onMouseDown={onFocus}
    >
      <div className="win-titlebar" onMouseDown={handleTitleMouseDown} onDoubleClick={onMaximize}>
        <span className="win-titlebar-icon">{win.icon}</span>
        <span className="win-titlebar-title">{win.title}</span>
        <div className="win-titlebar-controls">
          <button onClick={onMinimize} title="Pienennä">−</button>
          <button onClick={onMaximize} title="Palauta/suurenna">□</button>
          <button onClick={onClose} title="Sulje" className="win-close">✕</button>
        </div>
      </div>
      <div className="win-content">{children}</div>
      {!win.maximized && <div className="win-resize-handle" onMouseDown={handleResizeMouseDown} />}
    </div>
  );
}
