from pathlib import Path
import sys

path = Path("src/pages/ProjectDetails.jsx")

if not path.exists():
    print("VIRHE: src/pages/ProjectDetails.jsx ei löytynyt.")
    print("Aja tämä skripti Wood-Booster-OS-projektin juurikansiossa.")
    sys.exit(1)

text = path.read_text(encoding="utf-8")
original = text

backup = path.with_suffix(".jsx.backup")
backup.write_text(text, encoding="utf-8")

import_line = 'import GalleryTab from "../components/GalleryTab"\n'

if import_line not in text:
    import_markers = [
        'import ProjectEditor from "../components/ProjectEditor"\n',
        'import TimelineTab from "../components/TimelineTab"\n',
        'import QuoteTab from "../components/QuoteTab"\n',
    ]

    inserted = False

    for marker in import_markers:
        if marker in text:
            text = text.replace(marker, marker + import_line, 1)
            inserted = True
            break

    if not inserted:
        print("VIRHE: GalleryTab-importin paikkaa ei löytynyt.")
        print("Varmuuskopio tehtiin:", backup)
        sys.exit(1)

gallery_button = '''            <TabButton
              active={activeTab === "gallery"}
              onClick={() => setActiveTab("gallery")}
            >
              📸 Kuvat
            </TabButton>

'''

if 'setActiveTab("gallery")' not in text:
    button_markers = [
        '''            <TabButton
              active={activeTab === "timeline"}''',
        '''          <TabButton
            active={activeTab === "timeline"}''',
    ]

    inserted = False

    for marker in button_markers:
        if marker in text:
            text = text.replace(marker, gallery_button + marker, 1)
            inserted = True
            break

    if not inserted:
        print("VIRHE: Aikajana-välilehden painiketta ei löytynyt.")
        print("Varmuuskopio tehtiin:", backup)
        sys.exit(1)

gallery_content = '''          {activeTab === "gallery" && (
            <GalleryTab projectId={project.id} />
          )}

'''

if 'activeTab === "gallery"' not in text:
    content_markers = [
        '''          {activeTab === "timeline" && (''',
        '''        {activeTab === "timeline" && (''',
    ]

    inserted = False

    for marker in content_markers:
        if marker in text:
            text = text.replace(marker, gallery_content + marker, 1)
            inserted = True
            break

    if not inserted:
        print("VIRHE: TimelineTab-sisällön paikkaa ei löytynyt.")
        print("Varmuuskopio tehtiin:", backup)
        sys.exit(1)

if text == original:
    print("Kuvat-välilehti näyttää olevan jo lisätty.")
else:
    path.write_text(text, encoding="utf-8")
    print("✓ Kuvat-välilehti lisättiin ProjectDetails.jsx-tiedostoon.")

print("✓ Varmuuskopio:", backup)
print("Seuraavaksi aja: npm run build")
