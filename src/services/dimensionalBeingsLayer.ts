import { getConfigSection } from '../configLoader';

export interface DimensionMetadata {
  dimensionId: string;
  resonanceHz: number;
  dominantEntity: string;
  stability: string;
}

export class DimensionalBeingsLayer {
  private static instance: DimensionalBeingsLayer;
  private realmRegistry: DimensionMetadata[] = [
    { dimensionId: "Dimension-96", resonanceHz: 528, dominantEntity: "Spacemonkey & Chimp", stability: "Absolute" },
    { dimensionId: "Aurora Realm", resonanceHz: 432, dominantEntity: "Aatos the Reindeer", stability: "Harmonic" },
    { dimensionId: "Yggdrasil Roots", resonanceHz: 111, dominantEntity: "Odin & Fenrir", stability: "Eternal" },
    { dimensionId: "Toad Workshop", resonanceHz: 640, dominantEntity: "Mario the Toad", stability: "High Octane" }
  ];

  private constructor() {
    const config: any = getConfigSection('multiverse_gateway');
    if (config) {
      console.log(`[DimensionalLayer] Moniulotteinen olentojen rekisteri aktivoitu.`);
    }
  }

  public static getInstance(): DimensionalBeingsLayer {
    if (!DimensionalBeingsLayer.instance) {
      DimensionalBeingsLayer.instance = new DimensionalBeingsLayer();
    }
    return DimensionalBeingsLayer.instance;
  }

  public getDimensionInfo(dimensionId: string): DimensionMetadata | undefined {
    console.log(`[DimensionalLayer] Haetaan tietoja ulottuvuudesta: ${dimensionId}`);
    return this.realmRegistry.find(d => d.dimensionId === dimensionId);
  }

  public getAllRealms(): DimensionMetadata[] {
    return this.realmRegistry;
  }

  public registerEntitySync(dimensionId: string, entityName: string): string {
    return `Olento '${entityName'}' synkronoitu onnistuneesti ulottuvuuteen ${dimensionId}. Resonanssi vakaa.`;
  }
}

export const dimensionalBeings = DimensionalBeingsLayer.getInstance();
