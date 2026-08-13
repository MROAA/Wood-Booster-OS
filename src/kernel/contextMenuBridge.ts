import { mythosScroller } from './mythosScroller';
import { notificationEngine } from './notificationEngine';

export class ContextMenuBridge {
  public createTextFile(fileName: string = 'uusi_muistio.txt'): string {
    console.log(`📄 [CONTEXT MENU] Luodaan uusi tekstitiedosto: ${fileName}`);
    mythosScroller.addLog('File_Manager', `Luotiin tiedosto: ${fileName}`);
    notificationEngine.notify('Tiedosto luotu', `Tekstitiedosto "${fileName}" luotiin työpöydälle.`);
    return `📄 Tiedosto "${fileName}" luotu onnistuneesti.`;
  }
}

export const contextMenuBridge = new ContextMenuBridge();
