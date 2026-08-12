import { memoryMaintenance } from './memoryMaintenance';
import { workshopWatcher } from './workshopWatcher';
import { notificationEngine } from './notificationEngine';
import { mythosScroller } from './mythosScroller';

export class MasterAutomationDaemon {
  private daemonInterval: any = null;
  private isRunning: boolean = false;

  public startMasterDaemon(intervalMinutes: number = 30): string {
    if (this.isRunning) return '⚙️ Master Daemon pyörii jo taustalla.';

    this.isRunning = true;
    const intervalMs = intervalMinutes * 60 * 1000;

    notificationEngine.notify('Automaatio käynnistetty', 'Spacemonkey Master Daemon aktivoituu.');

    this.daemonInterval = setInterval(() => {
      console.log('🔄 [MASTER DAEMON] Suoritetaan autonominen kierros...');
      
      // 1. Tarkkaile verstasta
      workshopWatcher.inspectWorkshop();

      // 2. Siivoa C++ muistia (RAG)
      memoryMaintenance.performCompaction();

      // 3. Kirjaa myyttiin
      mythosScroller.addLog('Master_Daemon', 'Autonominen kierros suoritettu onnistuneesti.');
      
      notificationEngine.notify('Autonominen sykli', 'Spacemonkey optimoi verstaan ja muistin taustalla.');
    }, intervalMs);

    return `🚀 Master Automation Daemon aktivoitu! Spacemonkey hoitaa nyt verstaan ja järjestelmän huollot automaattisesti joka ${intervalMinutes}. minuutti.`;
  }

  public stopMasterDaemon(): string {
    if (!this.isRunning) return 'Daemon ei ole päällä.';
    clearInterval(this.daemonInterval);
    this.isRunning = false;
    notificationEngine.notify('Automaatio pysäytetty', 'Master Daemon suljettu.');
    return '⏹️ Master Daemon pysäytetty.';
  }

  public getStatus(): string {
    return this.isRunning ? 'ACTIVE_FULL_AUTOMATION' : 'IDLE';
  }
}

export const masterAutomation = new MasterAutomationDaemon();
