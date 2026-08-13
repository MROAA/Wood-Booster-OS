app.post('/api/compositor/move', (req, res) => {
    const { windowId, x, y } = req.body;
    
    // Kutsutaan C++-compositorin metodia
    try {
        WoodBoosterCore.compositor.updateWindowPosition(windowId, x, y);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: "Compositor_Update_Failed" });
    }
});
// Lisää tämä olemassa olevien reittien joukkoon
app.get('/api/vfs/list', async (req, res) => {
    try {
        // Kutsutaan C++-ytimen VFS-moduulia
        const fileList = WoodBoosterCore.vfs.listDirectory("/"); 
        res.json(fileList);
    } catch (err) {
        res.status(500).json({ error: "VFS_ACCESS_DENIED" });
    }
});
