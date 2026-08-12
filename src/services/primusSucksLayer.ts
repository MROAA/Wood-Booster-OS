import { getConfigSection } from '../configLoader';

export interface PrimusStatus {
  grooveType: string;
  bassSlapIntensity: string;
  rebellionManifesto: string;
  fanchant: string;
}

export class PrimusSucksLayer {
  private static instance: PrimusSucksLayer;
  private grooveType: string = "Weird, Slap-Heavy Avant-Funk";
  private bassSlapIntensity: string;
  private rebellionManifesto: string = "Embrace the Weirdness & Reject the Mainstream";
  private fanchant: string = "Primus sucks!";

  private constructor() {
    const config: any = getConfigSection('boosterverse_supreme_manifest');
    if (config) {
      console.log(`[PrimusSucksLayer] Nelikielinen basson murina täyttää verstaan: Primus sucks!`);
    }
  }

  public static getInstance(): PrimusSucksLayer {
    if (!PrimusSucksLayer.instance) {
      PrimusSucksLayer.instance = new PrimusSucksLayer();
    }
    return PrimusSucksLayer.instance;
  }

  public unleashSlap(): string {
    console.log(`[PrimusSucksLayer] Soitetaan säröinen basissolo ja huudetaan ilmoille totuus...`);
    return `${this.fanchant} Win96-alustan taajuudet vääristyvät eeppiseen funk-metallin grooveen ja kaikki tanssivat vastustamattomasti mukana!`;
  }

  public getStatus(): PrimusStatus {
    return {
      grooveType: this.grooveType,
      bassSlapIntensity: "Maximum Thump / Four-String Fury",
      rebellionManifesto: this.rebellionManifesto,
      fanchant: this.fanchant
    };
  }
}

export const primusSucks = PrimusSucksLayer.getInstance();
