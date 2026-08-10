import { useCallback, useEffect, useState } from 'react';
import UploadDropzone from './UploadDropzone';

const WORKSPACE_API = 'http://127.0.0.1:8002/api/workspace';

const CATEGORY_ICON = {
  image: '🖼️',
  video: '🎬',
  pdf: '📄',
  archive: '🗜️',
  generic: '📦',
};

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function VirtualWorkspacePanel({ refreshSignal } = {}) {
  const [breadcrumb, setBreadcrumb] = useState([{ id: null, name: 'Työtila' }]);
  const [folders, setFolders] = useState([]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  const currentFolderId = breadcrumb[breadcrumb.length - 1].id;

  const loadFolder = useCallback((folderId) => {
    setLoading(true);
    setError(null);
    const query = folderId ? `?parent_id=${encodeURIComponent(folderId)}` : '';
    fetch(`${WORKSPACE_API}/folders${query}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Backend vastasi virheellä (${res.status}).`);
        return res.json();
      })
      .then((data) => {
        setFolders(data.folders || []);
        setFiles(data.files || []);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadFolder(currentFolderId);
  }, [currentFolderId, loadFolder, refreshSignal]);

  const openFolder = (folder) => {
    setBreadcrumb((prev) => [...prev, { id: folder.id, name: folder.name }]);
  };

  const jumpToBreadcrumb = (index) => {
    setBreadcrumb((prev) => prev.slice(0, index + 1));
  };

  const handleCreateFolder = (e) => {
    e.preventDefault();
    const name = newFolderName.trim();
    if (!name) return;
    fetch(`${WORKSPACE_API}/folders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, parent_id: currentFolderId }),
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Kansion luonti epäonnistui (${res.status}).`);
        return res.json();
      })
      .then(() => {
        setNewFolderName('');
        setIsCreatingFolder(false);
        loadFolder(currentFolderId);
      })
      .catch((err) => setError(err.message));
  };

  const handleDeleteFolder = (folder) => {
    fetch(`${WORKSPACE_API}/folders/${folder.id}`, { method: 'DELETE' })
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.detail || `Kansion poisto epäonnistui (${res.status}).`);
        }
        loadFolder(currentFolderId);
      })
      .catch((err) => setError(err.message));
  };

  const handleDeleteFile = (file) => {
    fetch(`${WORKSPACE_API}/files/${file.id}`, { method: 'DELETE' })
      .then((res) => {
        if (!res.ok) throw new Error(`Tiedoston poisto epäonnistui (${res.status}).`);
        loadFolder(currentFolderId);
      })
      .catch((err) => setError(err.message));
  };

  return (
    <div className="flex flex-col h-full">
      <header className="mb-3">
        <h2 className="text-lg font-semibold text-[var(--wood-text)]">
          🗂 <span className="text-[var(--wood-accent)]">Projektityötila</span>
        </h2>
        <nav className="mt-1 flex flex-wrap items-center gap-1 text-xs text-[var(--wood-muted)]">
          {breadcrumb.map((crumb, index) => (
            <span key={crumb.id ?? 'root'} className="flex items-center gap-1">
              {index > 0 && <span>/</span>}
              <button
                type="button"
                onClick={() => jumpToBreadcrumb(index)}
                className={
                  index === breadcrumb.length - 1
                    ? 'text-[var(--wood-text)] font-medium'
                    : 'hover:text-[var(--wood-accent)] underline underline-offset-2'
                }
              >
                {crumb.name}
              </button>
            </span>
          ))}
        </nav>
      </header>

      <UploadDropzone folderId={currentFolderId} onUploaded={() => loadFolder(currentFolderId)} />

      <div className="flex items-center justify-between mt-4 mb-2">
        <span className="text-xs uppercase tracking-wide text-[var(--wood-muted)]">Sisältö</span>
        {isCreatingFolder ? (
          <form onSubmit={handleCreateFolder} className="flex items-center gap-2">
            <input
              autoFocus
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Kansion nimi"
              className="text-xs rounded-md bg-[var(--wood-card)] border border-[var(--wood-border)] px-2 py-1 text-[var(--wood-text)] outline-none"
            />
            <button type="submit" className="text-xs text-[var(--wood-accent)]">
              Luo
            </button>
            <button
              type="button"
              onClick={() => {
                setIsCreatingFolder(false);
                setNewFolderName('');
              }}
              className="text-xs text-[var(--wood-muted)]"
            >
              Peruuta
            </button>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setIsCreatingFolder(true)}
            className="text-xs text-[var(--wood-accent)] hover:underline"
          >
            + Uusi kansio
          </button>
        )}
      </div>

      {error && (
        <p className="text-xs text-red-500 mb-2 bg-red-500/10 border border-red-500/30 rounded-md px-2 py-1">
          {error}
        </p>
      )}

      <div className="flex-1 overflow-y-auto pr-1">
        {loading ? (
          <p className="text-xs text-[var(--wood-muted)]">Ladataan...</p>
        ) : folders.length === 0 && files.length === 0 ? (
          <p className="text-xs text-[var(--wood-muted)]">Tämä kansio on tyhjä.</p>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {folders.map((folder) => (
              <div
                key={folder.id}
                className="group relative rounded-lg border border-[var(--wood-border)] bg-[var(--wood-card)] p-3 cursor-pointer hover:border-[var(--wood-accent)]"
                onClick={() => openFolder(folder)}
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteFolder(folder);
                  }}
                  className="absolute top-1 right-1 text-[var(--wood-muted)] opacity-0 group-hover:opacity-100 hover:text-red-500 text-xs"
                  title="Poista kansio"
                >
                  ✕
                </button>
                <div className="text-2xl">📁</div>
                <div className="mt-1 text-xs text-[var(--wood-text)] truncate">{folder.name}</div>
              </div>
            ))}
            {files.map((file) => (
              <div
                key={file.id}
                className="group relative rounded-lg border border-[var(--wood-border)] bg-[var(--wood-card)] p-3"
              >
                <button
                  type="button"
                  onClick={() => handleDeleteFile(file)}
                  className="absolute top-1 right-1 text-[var(--wood-muted)] opacity-0 group-hover:opacity-100 hover:text-red-500 text-xs"
                  title="Poista tiedosto"
                >
                  ✕
                </button>
                <a
                  href={`${WORKSPACE_API}/files/${file.id}/download`}
                  target="_blank"
                  rel="noreferrer"
                  className="block"
                >
                  {file.category === 'image' && file.has_thumbnail ? (
                    <img
                      src={`${WORKSPACE_API}/files/${file.id}/thumbnail`}
                      alt={file.original_name}
                      className="h-16 w-full object-cover rounded-md"
                    />
                  ) : (
                    <div className="text-2xl">{CATEGORY_ICON[file.category] || CATEGORY_ICON.generic}</div>
                  )}
                  <div className="mt-1 text-xs text-[var(--wood-text)] truncate">{file.original_name}</div>
                  <div className="text-[10px] text-[var(--wood-muted)]">{formatSize(file.size_bytes)}</div>
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default VirtualWorkspacePanel;
