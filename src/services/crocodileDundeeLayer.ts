import { getConfigSection } from '../configLoader';

export interface DundeeStatus {
  legendName: string;
  knifeSize: string;
  outbackSurvivalRate: string;
  catchphrase: string;
}

export class CrocodileDundeeLayer {
  private static instance: CrocodileDundeeLayer;
  private legendName: string = "Mick 'Crocodile' Dundee";
  private knifeSize: string = "Bowie Knife / Absolute Unit";
  private outbackSurvivalRate: string = "100% / Untamed Outback Mastery";
  private catchphrase: string = "That's not a knife... THIS is a knife!";

  private constructor() {
    const config: any = getConfigSection('boosterverse_supreme_manifest');
    if (config) {
      console.log(`[CrocodileDundeeLayer] Mick Dundee astui sisään verstaalle hatunnoston kera.`);
    }
  }

  public static getInstance(): CrocodileDundeeLayer {
    if (!CrocodileDundeeLayer.instance) {
      CrocodileDundeeLayer.instance = new CrocodileDundeeLayer();
    }
    return CrocodileDundeeLayer.instance;
  }

  public wieldKnife(target: string): string {
    console.log(`[CrocodileDundeeLayer] Esitellään kunnon työkalu tilanteeseen: "${target}"...`);
    return `${this.catchphrase} (Kohde '${target}' ja kaikki maailman ongelmat ratkesivat yhdellä viillolla!)`;
  }

  public getStatus(): DundeeStatus {
    return {
      legendName: this.legendName,
      knifeSize: this.knifeSize,
      outbackSurvivalRate: this.outbackSurvivalRate,
      catchphrase: this.catchphrase
    };
  }
}

export const crocodileDundee = CrocodileDundeeLayer.getInstance();
