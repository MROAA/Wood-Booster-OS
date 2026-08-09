import { useEffect, useState } from 'react';

const DESKTOP_BASE = 'http://localhost:8002/api/desktop';

function formatSize(bytes) {
  if (bytes === null || bytes === undefined) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function BoosterverseDesktop() {
  const [currentPath, setCurrentPath] = useState('');
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileContent, setFileContent] = useState(null);
  const [fileLoading, setFileLoading] = useState(false);

  function loadDirectory(path) {
    setLoading(true);
    setError('');
    setSelectedFile(null);
    setFileContent(null);
    fetch(`${DESKTOP_BASE}/list?path=${encodeURIComponent(path)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.detail) {
          setError(data.detail);
          setEntries([]);
        } else {
          setCurrentPath(data.path);
          setEntries(data.entries);
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadDirectory('');
  }, []);

  function openEntry(entry) {
    if (entry.type === 'dir') {
      loadDirectory(entry.path);
      return;
    }
    setSelectedFile(entry);
    setFileLoading(true);
    setFileContent(null);
    fetch(`${DESKTOP_BASE}/read?path=${encodeURIComponent(entry.path)}`)
      .then((res) => res.json())
      .then((data) => setFileContent(data))
      .catch((err) => setFileContent({ readable: false, message: err.message }))
      .finally(() => setFileLoading(false));
  }

  function goUp() {
    if (!currentPath) return;
    const parts = currentPath.split('/');
    parts.pop();
    loadDirectory(parts.join('/'));
  }

  const breadcrumbParts = currentPath ? currentPath.split('/') : [];

  return (
    <div style={{ padding: '1.5rem', color: 'var(--wood-text)', maxWidth: '1100px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>
        🖥 Boosterverse <span style={{ color: 'var(--wood-accent)' }}>Desktop</span>
      </h1>
      <p style={{ color: 'var(--wood-muted, #9ca3af)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
        Vain katselu - Wood-Booster-AI-projektikansio. Spacemonkey ei vielä siirrä tai poista mitään.
      </p>

      <div style={{ display: 'flex', gap: '1rem' }}>
        <div
          style={{
            flex: '1 1 45%',
            border: '1px solid var(--wood-border)',
            borderRadius: '8px',
            background: 'var(--wood-panel)',
            padding: '0.75rem',
            minHeight: '420px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', fontSize: '0.85rem' }}>
            <button
              onClick={goUp}
              disabled={!currentPath}
              style={{
                padding: '0.25rem 0.6rem',
                borderRadius: '6px',
                border: '1px solid var(--wood-border)',
                background: 'transparent',
                color: 'var(--wood-text)',
                cursor: currentPath ? 'pointer' : 'default',
                opacity: currentPath ? 1 : 0.4,
              }}
            >
              ↑ Ylös
            </button>
            <span style={{ color: 'var(--wood-muted, #9ca3af)' }}>
              /{breadcrumbParts.join(' / ')}
            </span>
          </div>

          {loading && <p style={{ fontSize: '0.85rem' }}>Ladataan...</p>}
          {error && <p style={{ fontSize: '0.85rem', color: '#c96f5c' }}>{error}</p>}

          {!loading && !error && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
              {entries.map((entry) => (
                <button
                  key={entry.path}
                  onClick={() => openEntry(entry)}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    width: '100%',
                    textAlign: 'left',
                    padding: '0.35rem 0.5rem',
                    borderRadius: '6px',
                    border: 'none',
                    background:
                      selectedFile?.path === entry.path ? 'rgba(107, 127, 74, 0.15)' : 'transparent',
                    color: 'var(--wood-text)',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                  }}
                >
                  <span>
                    {entry.type === 'dir' ? '📁' : '📄'} {entry.name}
                  </span>
                  <span style={{ color: 'var(--wood-muted, #9ca3af)', fontSize: '0.75rem' }}>
                    {formatSize(entry.size)}
                  </span>
                </button>
              ))}
              {entries.length === 0 && (
                <p style={{ fontSize: '0.85rem', color: 'var(--wood-muted, #9ca3af)' }}>
                  Kansio on tyhjä.
                </p>
              )}
            </div>
          )}
        </div>

        <div
          style={{
            flex: '1 1 55%',
            border: '1px solid var(--wood-border)',
            borderRadius: '8px',
            background: 'var(--wood-panel)',
            padding: '0.75rem',
            minHeight: '420px',
          }}
        >
          {!selectedFile && (
            <p style={{ fontSize: '0.85rem', color: 'var(--wood-muted, #9ca3af)' }}>
              Valitse tiedosto vasemmalta esikatsellaksesi sen sisällön.
            </p>
          )}
          {selectedFile && (
            <>
              <div style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                {selectedFile.name}
              </div>
              {fileLoading && <p style={{ fontSize: '0.85rem' }}>Ladataan...</p>}
              {!fileLoading && fileContent && !fileContent.readable && (
                <p style={{ fontSize: '0.85rem', color: 'var(--wood-muted, #9ca3af)' }}>
                  {fileContent.message}
                </p>
              )}
              {!fileLoading && fileContent?.readable && (
                <pre
                  style={{
                    fontSize: '0.8rem',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    maxHeight: '380px',
                    overflowY: 'auto',
                    background: 'var(--wood-bg)',
                    padding: '0.75rem',
                    borderRadius: '6px',
                    border: '1px solid var(--wood-border)',
                  }}
                >
                  {fileContent.content}
                </pre>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
