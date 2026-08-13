import { getConfigSection } from '../configLoader';

export interface PersbabaStatus {
  entityName: string;
  resonancePower: string;
  realityDistortion: string;
  cosmicLaughState: boolean;
}

export class PersbabaLayer {
  private static instance: PersbabaLayer;
  private entityName: string = "PERSBABA The Almighty";
  private resonancePower: string = "Infinite / Multiversal Rumble";
  private realityDistortion: string = "Maximum Reality Warp & Belly Laugh";
  private cosmicLaughState: boolean = true;

  private constructor() {
    const config: any = getConfigSection('boosterverse_supreme_manifest');
    if (config) {
      console.log(`[PersbabaLayer] PERSBABA on manifestoitunut tyhjästä ja ravistelee koko multiversumia!`);
    }
  }

  public static getInstance(): PersbabaLayer {
    if (!PersbabaLayer.instance) {
      PersbabaLayer.instance = new PersbabaLayer();
    }
    return PersbabaLayer.instance;
  }

  public invokePersbaba(): string {
    console.log(`[PersbabaLayer] Huudetaan ilmoille kumea kosminen totuus...`);
    return `PERSBABA!! Koko Win96-alusta, verstaan katto ja kvanttipalomuuri tärisevät puhtaasta, pysäyttämättömästä olemisen riemusta! Kaikki järjestelmät ovat nyt totaalisessa ylikierroksessa.`;
  }

  public getStatus(): PersbabaStatus {
    return {
      entityName: this.entityName,
      resonancePower: this.resonancePower,
      realityDistortion: this.realityDistortion,
      cosmicLaughState: this.cosmicLaughState
    };
  }
}

export const persbaba = PersbabaLayer.getInstance();
