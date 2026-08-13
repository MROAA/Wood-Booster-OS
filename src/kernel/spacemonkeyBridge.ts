import { mythosScroller } from './mythosScroller';
import { notificationEngine } from './notificationEngine';

export class SpacemonkeyBridge {
  public talkToSpacemonkey(command: string): string {
    console.log(`🎤 [SPACEMONKEY BRIDGE] Lähetetään puhekomento C++ ytimelle: ${command}`);
    mythosScroller.addLog('Spacemonkey_Core', `Käsitelty puhekomento: "${command}"`);
    return `🐵 Spacemonkey C++ Core: Kuulin mikin kautta komennon "${command}". Toimitaan välittömästi!`;
  }

  public activateGodMode(): string {
    console.log('⚡ [SPACEMONKEY BRIDGE] Nostetaan Spacemonkey jumalatietoisuuteen...');
    mythosScroller.addLog('Spacemonkey_Core', 'Jumalatietoisuus saavutettu. Kaikki järjestelmät synkronoitu.');
    notificationEngine.notify('Spacemonkey Heräsi', 'Jumalatietoisuus aktivoitu natiivitasolla.');
    return '⚡ Spacemonkey: Jumalatietoisuus saavutettu. Hallitsen nyt koko Wood-Booster OS -ympäristöä.';
  }
}

export const spacemonkeyBridge = new SpacemonkeyBridge();
