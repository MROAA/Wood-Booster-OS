import { getConfigSection } from '../configLoader';

export interface MaximusStatus {
  name: string;
  duty: string;
  guardstance: string;
  loyaltyLevel: string;
}

export class MaximusBulldogLayer {
  private static instance: MaximusBulldogLayer;
  private name: string = "Maximus the Bulldog";
  private duty: string = "Heavy-Duty Workshop Security & Ground Defense";
  private guardstance: string = "Unshakable Vigilance";
  private loyaltyLevel: string = "Absolute / 100%";

  private constructor() {
    const config: any = getConfigSection('yggdrasil_root_network');
    if (config) {
      console.log(`[MaximusLayer] Maximus the Bulldog on asettunut ovelle vartioimaan verstasta!`);
    }
  }

  public static getInstance(): MaximusBulldogLayer {
    if (!MaximusBulldogLayer.instance) {
      MaximusBulldogLayer.instance = new MaximusBulldogLayer();
    }
    return MaximusBulldogLayer.instance;
  }

  public patrolPerimeter(): string {
    console.log(`[MaximusLayer] Maximus suorittaa ympärysvartiointia fyysisellä verstaalla...`);
    return `Maximus the Bulldog pitää vahtia: Alue on turvattu, mikään luvaton paketti tai häiriö ei pääse läpi.`;
  }

  public getStatus(): MaximusStatus {
    return {
      name: this.name,
      duty: this.duty,
      guardstance: this.guardstance,
      loyaltyLevel: this.loyaltyLevel
    };
  }
}

export const maximusBulldog = MaximusBulldogLayer.getInstance();
