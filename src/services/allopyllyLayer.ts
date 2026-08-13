import { getConfigSection } from '../configLoader';

export interface AbsurdityStatus {
  childishFactor: string;
  sillinessLevel: string;
  humorProtocol: string;
  catchphrase: string;
}

export class AllopyllyLayer {
  private static instance: AllopyllyLayer;
  private childishFactor: string = "Maximum / Pure Innocence";
  private sillinessLevel: string = "Over 9000";
  private humorProtocol: string = "Nonsense-Driven Development";
  private catchphrase: string = "Ällöpylly!";

  private constructor() {
    const config: any = getConfigSection('boosterverse_supreme_manifest');
    if (config) {
      console.log(`[AllopyllyLayer] Absurdi huumoriprotokolla ladattu. Järki on poissa.`);
    }
  }

  public static getInstance(): AllopyllyLayer {
    if (!AllopyllyLayer.instance) {
      AllopyllyLayer.instance = new AllopyllyLayer();
    }
    return AllopyllyLayer.instance;
  }

  public triggerSilliness(): string {
    console.log(`[AllopyllyLayer] Laukaistaan täysin järjetön huudahdus...`);
    return `${this.catchphrase} (Win96-alustan vakavuuskerroin putosi nollaan sekunnissa!)`;
  }

  public getStatus(): AbsurdityStatus {
    return {
      childishFactor: this.childishFactor,
      sillinessLevel: this.sillinessLevel,
      humorProtocol: this.humorProtocol,
      catchphrase: this.catchphrase
    };
  }
}

export const allopylly = AllopyllyLayer.getInstance();
