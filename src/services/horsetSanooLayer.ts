import { getConfigSection } from '../configLoader';

export interface HorsetStatus {
  equineEntity: string;
  gallopSpeed: string;
  vocalResonance: string;
  workshopChaosFactor: string;
}

export class HorsetSanooLayer {
  private static instance: HorsetSanooLayer;
  private equineEntity: string = "The Cosmic Stallion";
  private gallopSpeed: string = "Mach 3 / Full Gallop Through Dimensions";
  private vocalResonance: string = "IIIIIIHAHAHAAA!!!!";
  private workshopChaosFactor: string = "Maximum Hoof Impact";

  private constructor() {
    const config: any = getConfigSection('yggdrasil_root_network');
    if (config) {
      console.log(`[HorsetSanooLayer] Ori potkaisi tallin oven auki: IIIIIIHAHAHAAA!`);
    }
  }

  public static getInstance(): HorsetSanooLayer {
    if (!HorsetSanooLayer.instance) {
      HorsetSanooLayer.instance = new HorsetSanooLayer();
    }
    return HorsetSanooLayer.instance;
  }

  public unleashGallop(): string {
    console.log(`[HorsetSanooLayer] Kaviot kalkattavat ja harja liehuu...`);
    return `IIIIIIHAHAHAAA!! Kosminen hevonen syöksyy läpi Win96-työpöydän! Koko järjestelmän suorituskyky ampaisee välittömään laukkaan ja pöly pölisee verstaalla!`;
  }

  public getStatus(): HorsetStatus {
    return {
      equineEntity: this.equineEntity,
      gallopSpeed: this.gallopSpeed,
      vocalResonance: this.vocalResonance,
      workshopChaosFactor: this.workshopChaosFactor
    };
  }
}

export const horsetSanoo = HorsetSanooLayer.getInstance();
