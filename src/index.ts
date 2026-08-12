import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';

const require = createRequire(import.meta.url);

let addon: any = {};
try {
    addon = require('../build/Release/wood_booster.node');
} catch (e) {
    // Fallback-tila, jos C++ -laajennusta ei ole vielä generoitu
    addon = {
        getSystemStats: () => ({ threads: 33, load: '12%', status: 'Mock Core Active' }),
        vfsList: () => ({}),
        vfsWrite: (p: string, c: string) => true,
        vfsRead: (p: string) => "mock content",
        compositorGetList: () => [],
        compositorUpsert: (w: any) => w,
        smExecute: (cmd: string) => "Spacemonkey processed: " + cmd,
        audioGetActive: () => [],
        netGetSockets: () => [],
        procList: () => [],
        procSpawn: (pid: number, name: string) => true,
        kernelGetLogs: () => ["[SYSTEM] Running on fallback mock core."],
        kernelLog: (msg: string) => {}
    };
}

export const WoodBoosterCore = addon;
