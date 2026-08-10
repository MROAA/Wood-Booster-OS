class Windows11Terminal:
    def __init__(self):
        self.current_directory = "C:/Users/Marc"

    def execute_command(self, command):
        if command.startswith("cd "):
            path = command[3:].strip()
            self.current_directory = path
            return {"output": f"Directory changed to {self.current_directory}", "path": self.current_directory}
        elif command == "dir" or command == "ls":
            out_text = f""" Volume in drive C has no label.
 Directory of {self.current_directory}

 09.08.2026  19:00    <DIR>     Documents
 09.08.2026  19:00    <DIR>     Downloads
"""
            return {"output": out_text, "path": self.current_directory}
        elif command == "tasklist":
            out_text = """Handles   NPM(K)    PM(K)      WS(K)     CPU(s)      Id  SI ProcessName
--------------------------------------------------------------
    120       12     4500       1200       0.02    104   0 explorer.exe"""
            return {"output": out_text, "path": self.current_directory}
        else:
            return {"output": f"Command executed: {command}", "path": self.current_directory}

    def get_terminal_overview(self):
        return {
            "component": "Windows 11 Terminal",
            "current_directory": self.current_directory,
            "shells": ["PowerShell", "Command Prompt", "WSL (Ubuntu)"]
        }
