import { useCallback, useRef, useState } from 'react';

const WORKSPACE_API = 'http://127.0.0.1:8002/api/workspace';

function UploadDropzone({ folderId, onUploaded }) {
  const [items, setItems] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const uploadFile = useCallback(
    (file) => {
      const tempId = `temp-${Date.now()}-${Math.random()}`;
      setItems((prev) => [...prev, { id: tempId, name: file.name, status: 'uploading' }]);

      const formData = new FormData();
      formData.append('file', file);
      if (folderId) {
        formData.append('folder_id', folderId);
      }

      fetch(`${WORKSPACE_API}/upload`, {
        method: 'POST',
        body: formData,
      })
        .then((res) => {
          if (!res.ok) throw new Error(`Backend vastasi virheellä (${res.status}).`);
          return res.json();
        })
        .then((data) => {
          setItems((prev) =>
            prev.map((item) =>
              item.id === tempId ? { ...item, status: 'done', name: data.original_name } : item
            )
          );
          onUploaded?.();
        })
        .catch((err) => {
          setItems((prev) =>
            prev.map((item) =>
              item.id === tempId ? { ...item, status: 'error', error: err.message } : item
            )
          );
        });
    },
    [folderId, onUploaded]
  );

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      const files = Array.from(e.dataTransfer.files || []);
      files.forEach(uploadFile);
    },
    [uploadFile]
  );

  const handleFileInputChange = useCallback(
    (e) => {
      const files = Array.from(e.target.files || []);
      files.forEach(uploadFile);
      e.target.value = '';
    },
    [uploadFile]
  );

  return (
    <div>
      <section
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDragging(true);
        }}
        onDragLeave={(e) => {
          e.stopPropagation();
          setIsDragging(false);
        }}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`
          rounded-xl border-2 border-dashed
          flex flex-col items-center justify-center gap-2
          py-6 cursor-pointer transition
          ${
            isDragging
              ? 'border-[var(--wood-accent)] bg-[var(--wood-card)]'
              : 'border-[var(--wood-border)] bg-transparent'
          }
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileInputChange}
        />
        <span className="text-2xl">📥</span>
        <p className="text-sm text-[var(--wood-text)]">Pudota tiedostoja tähän, tai klikkaa valitaksesi</p>
        <p className="text-xs text-[var(--wood-muted)]">Kuvat, videot ja muut tiedostot</p>
      </section>
      {items.length > 0 && (
        <div className="mt-3 space-y-1">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between rounded-lg bg-[var(--wood-card)] border border-[var(--wood-border)] px-3 py-1.5 text-xs"
            >
              <span className="text-[var(--wood-text)] truncate">{item.name}</span>
              <span
                className={
                  item.status === 'done'
                    ? 'text-emerald-500'
                    : item.status === 'error'
                    ? 'text-red-500'
                    : 'text-[var(--wood-muted)]'
                }
              >
                {item.status === 'uploading' && 'Ladataan...'}
                {item.status === 'done' && 'Valmis ✓'}
                {item.status === 'error' && (item.error || 'Virhe')}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default UploadDropzone;
