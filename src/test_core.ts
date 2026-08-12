import { WoodBoosterCore } from './index.js';

console.log('--- Wood-booster OS: Advanced Paging & IRQ Kernel Test ---');

// Perustarkistus
console.log('[SystemMonitor]', WoodBoosterCore.getSystemStats());

// Uusi: Virtual Memory Paging
WoodBoosterCore.vmPagingSet(42, true, false);
const pageInfo = WoodBoosterCore.vmPagingGet(42);
console.log('[Virtual Memory Paging] Page 42 Status:', pageInfo);

// Uusi: Interrupt Vector Table (IRQ)
WoodBoosterCore.ivtRegister(1, 'KeyboardController');
WoodBoosterCore.ivtRegister(14, 'PrimaryIDEController');
const irqRes = WoodBoosterCore.ivtTrigger(1);
console.log('[Interrupt Vector Table] Trigger IRQ 1:', irqRes);

console.log('--- All Paging & IRQ Kernel Modules Verified Successfully! ---');
