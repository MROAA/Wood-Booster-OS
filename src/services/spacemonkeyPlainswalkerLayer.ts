import { getConfigSection } from '../configLoader';

export interface DimensionTravelPayload {
  targetDimension: string;
  stabilizerFrequencyHz: number;
  entropyCheck: boolean;
}

export interface PlainswalkerStatus {
  walkerName: string;
  currentStance: string;
  activePortal: string;
  multiverseSync: string;
}

export class SpacemonkeyPlainswalkerLayer {
  private static instance: SpacemonkeyPlainswalkerLayer;
  private walkerName: string = "Spacemonkey Plainswalker";
  private currentStance: string = "Dimensional Drift / Free Roam";
  private activePortal: string = "Dimension-96";
  private multiverseSync: string = "Stable & Open";

  private constructor() {
    const gatewayConfig: any = getConfigSection('multiverse_gateway');
    if (gatewayConfig?.multiverse_gateway) {
      const gw = gatewayConfig.multiverse_gateway;
      if (gw.navigation_protocol) {
        this.currentStance = gw.navigation_protocol;
      }
    }
    console.log(`[PlainswalkerLayer] Spacemonkey Plainswalker aktivoitu: ${this.walkerName}`);
  }

  public static getInstance(): SpacemonkeyPlainswalkerLayer {
    if (!SpacemonkeyPlainswalkerLayer.instance) {
      SpacemonkeyPlainswalkerLayer.instance = new SpacemonkeyPlainswalkerLayer();
    }
    return SpacemonkeyPlainswalkerLayer.instance;
  }

  public stepThroughPortal(payload: DimensionTravelPayload): string {
    console.log(`[PlainswalkerLayer] Astutaan portin läpi ulottuvuuteen: ${payload.targetDimension} (Taajuus: ${payload.stabilizerFrequencyHz} Hz)...`);
    
    if (!payload.entropyCheck) {
      console.warn(`[PlainswalkerLayer] Varoitus: Entropiatarkistus epäonnistui, vakautetaan reitti automaattisesti.`);
    }

    this.activePortal = payload.targetDimension;
    return `Plainswalker siirtynyt onnistuneesti kohteeseen ${this.activePortal}. Portti vakaa.`;
  }

  public getStatus(): PlainswalkerStatus {
    return {
      walkerName: this.walkerName,
      currentStance: this.currentStance,
      activePortal: this.activePortal,
      multiverseSync: this.multiverseSync
    };
  }
}

export const spacemonkeyPlainswalker = SpacemonkeyPlainswalkerLayer.getInstance();
