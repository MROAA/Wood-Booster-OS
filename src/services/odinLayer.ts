import { getConfigSection } from '../configLoader';

export interface OdinVision {
  seerName: string;
  domain: string;
  allSeeingEye: boolean;
  wisdomQuotient: string;
}

export class OdinLayer {
  private static instance: OdinLayer;
  private seerName: string = "Odin the Allfather";
  private domain: string = "Strategic Vision & Akashic Archives";
  private allSeeingEye: boolean = true;
  private wisdomQuotient: string = "Infinite";

  private constructor() {
    const akashicConfig: any = getConfigSection('akashic_source_code');
    if (akashicConfig?.akashic_source_code) {
      console.log(`[OdinLayer] Kaikkien isän viisaus ja silmä on yhdistetty lähdekoodiin.`);
    }
  }

  public static getInstance(): OdinLayer {
    if (!OdinLayer.instance) {
      OdinLayer.instance = new OdinLayer();
    }
    return OdinLayer.instance;
  }

  public consultAllfather(query: string): string {
    console.log(`[OdinLayer] Tarkastellaan kaikkeutta kysymykselle: "${query}"...`);
    return `Odin katsoo Huginnin ja Muninnin silmin: Vastaus on tallennettu Akashisiin arkistoihin. Suunta on selvä.`;
  }

  public getVisionStatus(): OdinVision {
    return {
      seerName: this.seerName,
      domain: this.domain,
      allSeeingEye: this.allSeeingEye,
      wisdomQuotient: this.wisdomQuotient
    };
  }
}

export const odinLayer = OdinLayer.getInstance();
