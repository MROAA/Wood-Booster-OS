import { getConfigSection } from '../configLoader';

export interface CopyPasteStatus {
  duplicationMode: string;
  speed: string;
  efficiency: string;
  catchphrase: string;
}

export class CopyPasteLayer {
  private static instance: CopyPasteLayer;
  private duplicationMode: string = "Infinite/Perfect";
  private speed: string = "Instantaneous";
  private efficiency: string = "Maximum Output";
  private catchphrase: string = "Copy Paste: Ideasta toteutukseen sekunnin murto-osassa, koodi virtaa!";

  private constructor() {
    const config: any = getConfigSection('boosterverse_supreme_manifest');
    if (config) {
      console.log(`[CopyPasteLayer] Duplikaatioprotokolla aktivoitu. Koodi monistuu kuin itsestään.`);
    }
  }

  public static getInstance(): CopyPasteLayer {
    if (!CopyPasteLayer.instance) {
      CopyPasteLayer.instance = new CopyPasteLayer();
    }
    return CopyPasteLayer.instance;
  }

  public duplicateIdea(idea: string): string {
    console.log(`[CopyPasteLayer] Monistetaan ideaa: "${idea}"...`);
    return `${this.catchphrase} (Idea '${idea}' on nyt kopioitu ja skaalattu koko Boosterverseen!)`;
  }

  public getStatus(): CopyPasteStatus {
    return {
      duplicationMode: this.duplicationMode,
      speed: this.speed,
      efficiency: this.efficiency,
      catchphrase: this.catchphrase
    };
  }
}

export const copyPaste = CopyPasteLayer.getInstance();
