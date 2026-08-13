import { getConfigSection } from '../configLoader';

export interface WindowInstance {
  windowId: string;
  title: string;
  isOpen: boolean;
  zIndex: number;
}

export class Win96SimulatorLayer {
  private static instance: Win96SimulatorLayer;
  private osName: string = "Win96 Operating Environment";
  private kernelVersion: string = "1996.0.4-Quantum";
  private activeWindows: Map<string, WindowInstance> = new Map();

  private constructor() {
    const config: any = getConfigSection('desktop_environment');
    console.log(`[Win96Simulator] Simulaattorin ydin käynnistetty. Versio: ${this.kernelVersion}`);
  }

  public static getInstance(): Win96SimulatorLayer {
    if (!Win96SimulatorLayer.instance) {
      Win96SimulatorLayer.instance = new Win96SimulatorLayer();
    }
    return Win96SimulatorLayer.instance;
  }

  public openWindow(windowId: string, title: string): WindowInstance {
    console.log(`[Win96Simulator] Avataan ikkuna: "${title}" (${windowId})`);
    const win: WindowInstance = {
      windowId,
      title,
      isOpen: true,
      zIndex: this.activeWindows.size + 1
    };
    this.activeWindows.set(windowId, win);
    return win;
  }

  public closeWindow(windowId: string): boolean {
    console.log(`[Win96Simulator] Suljetaan ikkuna: ${windowId}`);
    return this.activeWindows.delete(windowId);
  }

  public getSystemStatus() {
    return {
      osName: this.osName,
      kernelVersion: this.kernelVersion,
      openWindowsCount: this.activeWindows.size,
      status: "STABLE & RENDERING"
    };
  }
}

export const win96Simulator = Win96SimulatorLayer.getInstance();
