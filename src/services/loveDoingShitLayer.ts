import { getConfigSection } from '../configLoader';

export interface MakerJoyStatus {
  corePhilosophy: string;
  funFactor: string;
  passionDrive: string;
  makerQuote: string;
}

export class LoveDoingShitLayer {
  private static instance: LoveDoingShitLayer;
  private corePhilosophy: string = "Pure Joy of Creation";
  private funFactor: string = "Infinite / Maximum Enjoyment";
  private passionDrive: string = "Unstoppable Maker Spirit";
  private makerQuote: string = "But I love it. It's fun to do shit :)";

  private constructor() {
    const config: any = getConfigSection('boosterverse_supreme_manifest');
    if (config) {
      console.log(`[LoveDoingShitLayer] Mestaritason tekemisen ilo ja aito intohimo on aktivoitu.`);
    }
  }

  public static getInstance(): LoveDoingShitLayer {
    if (!LoveDoingShitLayer.instance) {
      LoveDoingShitLayer.instance = new LoveDoingShitLayer();
    }
    return LoveDoingShitLayer.instance;
  }

  public celebrateMakerSpirit(): string {
    console.log(`[LoveDoingShitLayer] Naurahdetaan itsekseen ja naputellaan koodia lisää...`);
    return `${this.makerQuote} Win96-alusta loistaa ja koko verstas hymyilee, kun hommia tehdään täysillä ja sydämellä!`;
  }

  public getStatus(): MakerJoyStatus {
    return {
      corePhilosophy: this.corePhilosophy,
      funFactor: this.funFactor,
      passionDrive: this.passionDrive,
      makerQuote: this.makerQuote
    };
  }
}

export const loveDoingShit = LoveDoingShitLayer.getInstance();
