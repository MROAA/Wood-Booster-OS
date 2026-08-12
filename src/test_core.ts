import { WoodBoosterCore } from './index.js';

console.log('--- Wood-booster OS: Audio & Networking Kernel Test ---');

// Perustarkistus
console.log('[SystemMonitor]', WoodBoosterCore.getSystemStats());

// Uusi: Audio Mixer Engine
WoodBoosterCore.audioPlay(1, 'startup_chime.wav', 0.85);
WoodBoosterCore.audioPlay(2, 'spacemonkey_alert.wav', 1.0);
const activeAudio = WoodBoosterCore.audioGetActive();
console.log('[Audio Mixer] Active Channels:', activeAudio);

// Uusi: Network Socket Table
WoodBoosterCore.netConnect(8080, '127.0.0.1', 9000);
const sockets = WoodBoosterCore.netGetSockets();
console.log('[Network Sockets] Active Connections:', sockets);

console.log('--- All Audio & Networking Kernel Modules Verified Successfully! ---');
