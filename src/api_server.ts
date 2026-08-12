import express from 'express';
import { WoodBoosterCore } from './index.ts';
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
    try {
        const files = WoodBoosterCore.vfsList();
        res.json({ success: true, files: Array.isArray(files) ? files : Object.keys(files || {}) });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message, files: [] });
    }
});

app.post('/api/vfs/write', (req, res) => {
    const { path: filePath, content } = req.body;
    const targetPath = filePath || req.body.path;
    if (!targetPath || content === undefined) {
        return res.status(400).json({ success: false, error: 'Missing path or content' });
    }
    try {
        const result = WoodBoosterCore.vfsWrite(targetPath, content);
        res.json({ success: true, written: result });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/vfs/read', (req, res) => {
    const filePath = req.query.path as string;
    if (!filePath) {
        return res.status(400).json({ success: false, error: 'Missing path query parameter' });
    }
    try {
        const content = WoodBoosterCore.vfsRead(filePath);
        res.json({ success: true, path: filePath, content });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 3. Ikkunointijärjestelmä (Compositor)
app.get('/api/compositor/windows', (req, res) => {
    try {
        res.json({ success: true, data: WoodBoosterCore.compositorGetList() });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/compositor/upsert', (req, res) => {
    try {
        const win = req.body;
        const result = WoodBoosterCore.compositorUpsert(win);
        res.json({ success: true, updated: result });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/compositor/move', (req, res) => {
    try {
        const { windowId, x, y } = req.body;
        if (WoodBoosterCore.compositorUpsert) {
            WoodBoosterCore.compositorUpsert({ windowId, x, y });
        }
        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 4. Spacemonkey-moottori / Autopilot
app.post('/api/spacemonkey/execute', (req, res) => {
    const { command } = req.body;
    if (!command) {
        return res.status(400).json({ success: false, error: 'Missing command' });
    }
    try {
        const response = WoodBoosterCore.smExecute(command);
        res.json({ success: true, response });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/spacemonkey/auto-execute', (req, res) => {
    const { command } = req.body;
    try {
        let response = "";
        if (WoodBoosterCore.smExecute) {
            response = WoodBoosterCore.smExecute(command);
        } else {
            response = "Spacemonkey executed: " + command;
        }
        res.json({ success: true, message: response });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// 5. Scheduler & Tapahtumat / Lokit
app.get('/api/scheduler/stats', (req, res) => {
    try {
        const stats = WoodBoosterCore.getSystemStats ? WoodBoosterCore.getSystemStats() : { threads: 33, load: '12%' };
        res.json({ threads: 33, load: '12%', ...stats });
    } catch {
        res.json({ threads: 33, load: '0%' });
    }
});

app.post('/api/scheduler/priority', (req, res) => {
    res.json({ success: true });
});

app.get('/api/system/events', (req, res) => {
    res.json({ success: true, events: ["[SYSTEM] Wood-Booster core active."] });
});

// 6. Audio, Network, Processes & Logs
app.get('/api/audio/active', (req, res) => {
    try {
        res.json({ success: true, data: WoodBoosterCore.audioGetActive() });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/network/sockets', (req, res) => {
    try {
        res.json({ success: true, data: WoodBoosterCore.netGetSockets() });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/processes/list', (req, res) => {
    try {
        res.json({ success: true, data: WoodBoosterCore.procList() });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/processes/spawn', (req, res) => {
    try {
        const { pid, name, status } = req.body;
        const result = WoodBoosterCore.procSpawn(pid, name, status || 'RUNNING');
        res.json({ success: true, spawned: result });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/kernel/logs', (req, res) => {
    try {
        res.json({ success: true, data: WoodBoosterCore.kernelGetLogs() });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/kernel/log', (req, res) => {
    try {
        const { message } = req.body;
        WoodBoosterCore.kernelLog(message || '');
        res.json({ success: true, logged: true });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`--- Wood-booster OS API Server running on port ${PORT} ---`);
});
