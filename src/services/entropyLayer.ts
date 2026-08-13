import { getConfigSection } from '../configLoader';

export interface EntropyReport {
  currentEntropyLevel: number;
  chaosThreshold: number;
  stabilityStatus: string;
  recommendedResonance: string;
}

export class EntropyLayer {
  private static instance: EntropyLayer;
  private currentEntropyLevel: number = 0.042;
  private chaosThreshold: number = 0.850;
  private recommendedResonance: string = "528 Hz Master Frequency";

  private constructor() {
    const config: any = getConfigSection('boosterverse_supreme_manifest');
    if (config) {
      console.log(`[EntropyLayer] Entropian mittaus- ja säätelymoduuli aktivoitu.`);
    }
  }

  public static getInstance(): EntropyLayer {
    if (!EntropyLayer.instance) {
      EntropyLayer.instance = new EntropyLayer();
    }
    return EntropyLayer.instance;
  }

  public measureEntropy(fluctuation: number): EntropyReport {
    this.currentEntropyLevel = Number((this.currentEntropyLevel + fluctuation).toFixed(4));
    console.log(`[EntropyLayer] Mitattu entropiataso: ${this.currentEntropyLevel}`);

    let status = "Balanced & Flowing";
    if (this.currentEntropyLevel > this.chaosThreshold) {
      status = "WARNING: High Chaos Detected - Stabilization Required";
    }

    return {
      currentEntropyLevel: this.currentEntropyLevel,
      chaosThreshold: this.chaosThreshold,
      stabilityStatus: status,
      recommendedResonance: this.recommendedResonance
    };
  }

  public stabilizeSystem(): string {
    this.currentEntropyLevel = 0.010;
    console.log(`[EntropyLayer] Järjestelmän entropia nollattu ja vakautettu.`);
    return `Entropia palautettu optimaaliselle tasolle (${this.currentEntropyLevel}). Kaikki ulottuvuudet virtaavat puhtaasti.`;
  }
}

export const entropyLayer = EntropyLayer.getInstance();
