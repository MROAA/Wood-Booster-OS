import { getConfigSection } from '../configLoader';

export interface ToadStatus {
  name: string;
  specialty: string;
  speedBoost: string;
  workshopStatus: string;
}

export class MarioTheToadLayer {
  private static instance: MarioTheToadLayer;
  private name: string = "Mario the Toad";
  private specialty: string = "Quick Maintenance & Power-up Delivery";
  private speedBoost: string = "Super Mushroom Active";
  private workshopStatus: string = "Ready for Action";

  private constructor() {
    const config: any = getConfigSection('yggdrasil_root_network');
    if (config) {
      console.log(`[MarioToadLayer] Mario the Toad on saapunut verstaan ovelle ja valmiina hommiin!`);
    }
  }

  public static getInstance(): MarioTheToadLayer {
    if (!MarioTheToadLayer.instance) {
      MarioTheToadLayer.instance = new MarioTheToadLayer();
    }
    return MarioTheToadLayer.instance;
  }

  public deliverPowerUp(item: string): string {
    console.log(`[MarioToadLayer] Toimitetaan pikatoimituksena power-up: "${item}"...`);
    return `Mario the Toad ojentaa kohteelle esineen: '${item}'. Nopeus ja teho kasvoivat kymmenkertaisiksi!`;
  }

  public getStatus(): ToadStatus {
    return {
      name: this.name,
      specialty: this.specialty,
      speedBoost: this.speedBoost,
      workshopStatus: this.workshopStatus
    };
  }
}

export const marioTheToad = MarioTheToadLayer.getInstance();
