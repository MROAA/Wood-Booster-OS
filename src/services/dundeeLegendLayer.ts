import { getConfigSection } from '../configLoader';

export interface LegendStatus {
  survivalSkill: string;
  knifeSize: string;
  attitude: string;
  catchphrase: string;
}

export class DundeeLegendLayer {
  private static instance: DundeeLegendLayer;
  private survivalSkill: string = "Outback Master / Unstoppable";
  private knifeSize: string = "That's not a knife, THAT'S a knife!";
  private attitude: string = "Cool under pressure";
  private catchphrase: string = "Crocodile Dundee oli legenda: " + 
    "Kun bugit hyökkäävät, älä panikoi, vedä esiin se suurin veitsi ja ratkaise ongelma tyylillä!";

  private constructor() {
    const config: any = getConfigSection('boosterverse_supreme_manifest');
    if (config) {
      console.log(`[DundeeLegendLayer] Legendaarinen selviytymisprotokolla aktivoitu. Kukaan ei pelkää mitään.`);
    }
  }

  public static getInstance(): DundeeLegendLayer {
    if (!DundeeLegendLayer.instance) {
      DundeeLegendLayer.instance = new DundeeLegendLayer();
    }
    return DundeeLegendLayer.instance;
  }

  public handleCrisis(threat: string): string {
    console.log(`[DundeeLegendLayer] Käsitellään uhkaa: "${threat}" dundee-tyylillä...`);
    return `${this.catchphrase} (Uhka '${threat}' selätetty perinteisellä outback-viisaudella!)`;
  }

  public getStatus(): LegendStatus {
    return {
      survivalSkill: this.survivalSkill,
      knifeSize: this.knifeSize,
      attitude: this.attitude,
      catchphrase: this.catchphrase
    };
  }
}

export const dundeeLegend = DundeeLegendLayer.getInstance();
