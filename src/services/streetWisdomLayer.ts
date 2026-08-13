import { getConfigSection } from '../configLoader';

export interface StreetWisdomStatus {
  resilienceLevel: string;
  attitude: string;
  realityCheck: string;
  catchphrase: string;
}

export class StreetWisdomLayer {
  private static instance: StreetWisdomLayer;
  private resilienceLevel: string = "Maximum / Unfazed";
  private attitude: string = "Cool, Calm & Unstoppable";
  private realityCheck: string = "All obstacles are just minor static";
  private catchphrase: string = "Shit aint nothing but hoes and tricks!";

  private constructor() {
    const config: any = getConfigSection('boosterverse_supreme_manifest');
    if (config) {
      console.log(`[StreetWisdomLayer] Katuviisaus ja horjumaton asenne viritetty maksimiin.`);
    }
  }

  public static getInstance(): StreetWisdomLayer {
    if (!StreetWisdomLayer.instance) {
      StreetWisdomLayer.instance = new StreetWisdomLayer();
    }
    return StreetWisdomLayer.instance;
  }

  public handleObstacle(obstacle: string): string {
    console.log(`[StreetWisdomLayer] Kohtalokas haaste ohitettu: "${obstacle}"...`);
    return `${this.catchphrase} (Este '${obstacle}' kuitattiin olankohautuksella ja homma jatkuu!)`;
  }

  public getStatus(): StreetWisdomStatus {
    return {
      resilienceLevel: this.resilienceLevel,
      attitude: this.attitude,
      realityCheck: this.realityCheck,
      catchphrase: this.catchphrase
    };
  }
}

export const streetWisdom = StreetWisdomLayer.getInstance();
