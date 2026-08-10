import time

class Windows11Notepad:
    """Simuloi Windows 11 Notepadiä (välilehdet, tallennus, tekstinmuokkaus)."""
    def __init__(self):
        self.tabs = [
            {"id": 1, "title": "Untitled.txt", "content": "Tervetuloa Boosterverse Windows 11 Notepad -muistioon!", "modified": False}
        ]

    def create_tab(self, title="Untitled.txt", content=""):
        new_id = len(self.tabs) + 1
        new_tab = {"id": new_id, "title": title, "content": content, "modified": False}
        self.tabs.append(new_tab)
        return {"success": True, "message": f"Uusi välilehti {title} luotu.", "tabs": self.tabs}

    def update_tab_content(self, tab_id: int, content: str):
        for tab in self.tabs:
            if tab["id"] == tab_id:
                tab["content"] = content
                tab["modified"] = True
                return {"success": True, "message": f"Välilehden {tab_id} sisältö päivitetty.", "tab": tab}
        return {"success": False, "error": "Välilehteä ei löytynyt."}

    def get_notepad_overview(self):
        return {
            "component": "Windows 11 Notepad Application",
            "open_tabs_count": len(self.tabs),
            "tabs": self.tabs
        }
