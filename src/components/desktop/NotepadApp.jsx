import { useState } from 'react';

let nextTabId = 2;

function createTab(title = 'Uusi.txt', content = '') {
  const id = nextTabId;
  nextTabId += 1;
  return { id, title, content, modified: false };
}

export default function NotepadApp() {
  const [tabs, setTabs] = useState([
    { id: 1, title: 'Tervetuloa.txt', content: 'Tervetuloa Boosterverse Muistioon!', modified: false },
  ]);
  const [activeTabId, setActiveTabId] = useState(1);

  const activeTab = tabs.find((tab) => tab.id === activeTabId) ?? tabs[0];

  function addTab() {
    const tab = createTab();
    setTabs((prev) => [...prev, tab]);
    setActiveTabId(tab.id);
  }

  function closeTab(tabId) {
    setTabs((prev) => {
      const remaining = prev.filter((tab) => tab.id !== tabId);
      if (remaining.length === 0) {
        const fresh = createTab();
        setActiveTabId(fresh.id);
        return [fresh];
      }
      if (tabId === activeTabId) {
        setActiveTabId(remaining[remaining.length - 1].id);
      }
      return remaining;
    });
  }

  function updateContent(content) {
    setTabs((prev) =>
      prev.map((tab) =>
        tab.id === activeTabId ? { ...tab, content, modified: true } : tab,
      ),
    );
  }

  return (
    <div className="notepad-app">
      <div className="notepad-tabs">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={`notepad-tab ${tab.id === activeTabId ? 'active' : ''}`}
            onClick={() => setActiveTabId(tab.id)}
          >
            <span className="notepad-tab-title">
              {tab.title}
              {tab.modified ? ' •' : ''}
            </span>
            {tabs.length > 1 && (
              <button
                className="notepad-tab-close"
                onClick={(event) => {
                  event.stopPropagation();
                  closeTab(tab.id);
                }}
              >
                ×
              </button>
            )}
          </div>
        ))}
        <button className="notepad-tab-add" onClick={addTab}>+</button>
      </div>

      <textarea
        className="notepad-editor"
        value={activeTab?.content ?? ''}
        onChange={(event) => updateContent(event.target.value)}
        spellCheck={false}
      />
    </div>
  );
}
