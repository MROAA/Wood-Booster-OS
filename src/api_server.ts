import express from 'express';
import { WoodBoosterCore } from './index.js';

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3960;

// 1. Järjestelmän tilastot
app.get('/api/system/stats', (req, res) => {
    try {
        const stats = WoodBoosterCore.getSystemStats();
        res.json({ success: true, data: stats });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 2. Virtuaalitiedostojärjestelmä (VFS)
app.get('/api/vfs/list', (req, res) => {
    res.json({ success: true, data: WoodBoosterCore.vfsList() });
});

app.post('/api/vfs/write', (req, res) => {
    const { path, content } = req.body;
    if (!path || content === undefined) {
        return res.status(400).json({ success: false, error: 'Missing path or content' });
    }
    const result = WoodBoosterCore.vfsWrite(path, content);
    res.json({ success: true, written: result });
});

app.get('/api/vfs/read', (req, res) => {
    const path = req.query.path as string;
    if (!path) {
        return res.status(400).json({ success: false, error: 'Missing path query parameter' });
    }
    const content = WoodBoosterCore.vfsRead(path);
    res.json({ success: true, path, content });
});

// 3. Ikkunointijärjestelmä (Compositor)
app.get('/api/compositor/windows', (req, res) => {
    res.json({ success: true, data: WoodBoosterCore.compositorGetList() });
});

app.post('/api/compositor/upsert', (req, res) => {
    const win = req.body;
    const result = WoodBoosterCore.compositorUpsert(win);
    res.json({ success: true, updated: result });
});

// 4. Spacemonkey-moottori
app.post('/api/spacemonkey/execute', (req, res) => {
    const { command } = req.body;
    if (!command) {
        return res.status(400).json({ success: false, error: 'Missing command' });
    }
    const response = WoodBoosterCore.smExecute(command);
    res.json({ success: true, response });
});

// 5. Audio, Network, Processes & Logs
app.get('/api/audio/active', (req, res) => {
    res.json({ success: true, data: WoodBoosterCore.audioGetActive() });
});

app.get('/api/network/sockets', (req, res) => {
    res.json({ success: true, data: WoodBoosterCore.netGetSockets() });
});

app.get('/api/processes/list', (req, res) => {
    res.json({ success: true, data: WoodBoosterCore.procList() });
});

app.post('/api/processes/spawn', (req, res) => {
    const { pid, name, status } = req.body;
    const result = WoodBoosterCore.procSpawn(pid, name, status || 'RUNNING');
    res.json({ success: true, spawned: result });
});

app.get('/api/kernel/logs', (req, res) => {
    res.json({ success: true, data: WoodBoosterCore.kernelGetLogs() });
});

app.post('/api/kernel/log', (req, res) => {
    const { message } = req.body;
    WoodBoosterCore.kernelLog(message || '');
    res.json({ success: true, logged: true });
});

app.listen(PORT, () => {
    console.log(`--- Wood-booster OS API Server running on port ${PORT} ---`);
});
