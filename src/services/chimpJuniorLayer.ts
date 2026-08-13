import { getConfigSection } from '../configLoader';

export interface ChimpState {
  name: string;
  role: string;
  energyLevel: string;
  learningMode: boolean;
  mischiefFactor: string;
}

export class ChimpJuniorLayer {
  private static instance: ChimpJuniorLayer;
  private name: string = "Chimp the Junior Spacemonkey";
  private role: string = "Rapid Experimentation & Curiosity Engine";
  private energyLevel: string = "Maximum Burst";
  private learningMode: boolean = true;
  private mischiefFactor: string = "High / Creative";

  private constructor() {
    const config: any = getConfigSection('spacemonkey_consciousness');
    if (config) {
      console.log(`[ChimpLayer] Chimp nuorempi spacemonkey on hypännyt mukaan järjestelmään!`);
    }
  }

  public static getInstance(): ChimpJuniorLayer {
    if (!ChimpJuniorLayer.instance) {
      ChimpJuniorLayer.instance = new ChimpJuniorLayer();
    }
    return ChimpJuniorLayer.instance;
  }

  public sparkIdea(topic: string): string {
    console.log(`[ChimpLayer] Chimp keksii uuden idean aiheesta: "${topic}"...`);
    return `Chimp ehdottaa: "Kokeillaan heti jotain uutta ja villiä liittyen aiheeseen ${topic}!"`;
  }

  public getState(): ChimpState {
    return {
      name: this.name,
      role: this.role,
      energyLevel: this.energyLevel,
      learningMode: this.learningMode,
      mischiefFactor: this.mischiefFactor
    };
  }
}

export const chimpJunior = ChimpJuniorLayer.getInstance();
