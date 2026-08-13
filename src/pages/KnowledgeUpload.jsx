import { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
function KnowledgeUpload() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);
  const uploadFile = useCallback((file) => {
    const tempId = `temp-${Date.now()}-${Math.random()}`;
    setItems((prev) => [
      ...prev,
      { id: tempId, name: file.name, status: 'uploading' },
    ]);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', file.name);
    fetch('http://localhost:3001/api/knowledge/upload', {
      method: 'POST',
      body: formData,
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setItems((prev) =>
            prev.map((item) =>
              item.id === tempId
                ? { ...item, status: 'error', error: data.error }
                : item
            )
          );
          return;
        }
        setItems((prev) =>
          prev.map((item) =>
            item.id === tempId
              ? {
                  ...item,
                  status: 'done',
                  documentId: data.document.id,
                  title: data.document.title,
                }
              : item
          )
        );
      })
      .catch((err) => {
        console.error(err);
        setItems((prev) =>
          prev.map((item) =>
            item.id === tempId
              ? { ...item, status: 'error', error: 'Yhteysvirhe' }
              : item
          )
        );
      });
  }, []);
  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
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
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-2xl font-semibold text-[var(--wood-text)]">
          Tiedostojen <span className="text-[var(--wood-accent)]">lataus</span>
        </h1>
        <p className="text-sm text-[var(--wood-muted)]">
          Pudota tiedostoja tallentaaksesi ne tietopankkiin
        </p>
      </header>
      <section
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`
          flex-1
          min-h-[320px]
          rounded-2xl
          border-2
          border-dashed
          flex
          flex-col
          items-center
          justify-center
          gap-3
          cursor-pointer
          transition
          ${
            isDragging
              ? 'border-[var(--wood-accent)] bg-[var(--wood-card)]'
              : 'border-[var(--wood-border)] bg-[var(--wood-bg)]'
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
        <span className="text-4xl">📥</span>
        <p className="text-[var(--wood-text)] font-medium">
          Pudota tiedostoja tähän, tai klikkaa valitaksesi
        </p>
        <p className="text-xs text-[var(--wood-muted)]">
          Tuetut: TXT, MD, PDF, DOCX
        </p>
        {items.length > 0 && (
          <div className="w-full max-w-md mt-4 space-y-2">
            {items.map((item) => (
              <div
                key={item.id}
                onClick={(e) => {
                  e.stopPropagation();
                  if (item.documentId) navigate(`/knowledge/${item.documentId}`);
                }}
                className="flex items-center justify-between rounded-lg bg-[var(--wood-card)] border border-[var(--wood-border)] px-3 py-2 text-sm"
              >
                <span className="text-[var(--wood-text)] truncate">
                  {item.title || item.name}
                </span>
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
      </section>
    </div>
  );
}
export default KnowledgeUpload;
