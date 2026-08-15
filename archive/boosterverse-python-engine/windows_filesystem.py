class WindowsFileSystem:
    def __init__(self):
        self.drives = {"C:\\": {"Windows": {"System32": ["cmd.exe"]}, "Users": {"Marc": ["Desktop"]}}}
    def get_directory_tree(self):
        return self.drives
