import { getConfigSection } from '../configLoader';

export interface HaroldStatus {
  name: string;
  toolType: string;
  strikePower: string;
  workshopImpact: string;
}

export class HaroldTheHammerLayer {
  private static instance: HaroldTheHammerLayer;
  private name: string = "Harold the Hammer";
  private toolType: string = "Heavy-Duty Impact & Carpentry Force";
  private strikePower: string;
  private workshopImpact: string = "Maximum Structural Integrity";

  private constructor() {
    const config: any = getConfigSection('yggdrasil_root_network');
    if (config) {
      console.log(`[HaroldHammerLayer] Harold the Hammer kolahti pöydälle valmiina naulaamaan hommat kuntoon!`);
    }
  }

  public static getInstance(): HaroldTheHammerLayer {
    if (!HaroldTheHammerLayer.instance) {
      HaroldTheHammerLayer.instance = new HaroldTheHammerLayer();
    }
    return HaroldTheHammerLayer.instance;
  }

  public strikeNail(target: string): string {
    console.log(`[HaroldHammerLayer] Harold iskee suoraan kohteeseen: "${target}"...`);
    return `Harold the Hammer jysäyttää: "Kerralla sisään!" Kohteen '${target}' liitokset ja rakenteet ovat nyt ikuisesti kiinni.`;
  }

  public getStatus(): HaroldStatus {
    return {
      name: this.name,
      toolType: this.toolType,
      strikePower: "Unstoppable Force",
      workshopImpact: this.workshopImpact
    };
  }
}

export const haroldTheHammer = HaroldTheHammerLayer.getInstance();
