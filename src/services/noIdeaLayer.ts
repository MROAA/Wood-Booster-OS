import { getConfigSection } from '../configLoader';

export interface IgnoranceStatus {
  stateOfMind: string;
  confusionLevel: string;
  zenWisdom: string;
  catchphrase: string;
}

export class NoIdeaLayer {
  private static instance: NoIdeaLayer;
  private stateOfMind: string = "Pure Blameless Zen Ignorance";
  private confusionLevel: string = "100% / Absolute Mystery";
  private zenWisdom: string = "Kun ei tiedä mistään mitään, mikään ei voi mennä rikki.";
  private catchphrase: string = "I assure you I've no idea!";

  private constructor() {
    const config: any = getConfigSection('boosterverse_supreme_manifest');
    if (config) {
      console.log(`[NoIdeaLayer] Vilpitön tietämättömyys on otettu käyttöön. Stressi katosi saman tien.`);
    }
  }

  public static getInstance(): NoIdeaLayer {
    if (!NoIdeaLayer.instance) {
      NoIdeaLayer.instance = new NoIdeaLayer();
    }
    return NoIdeaLayer.instance;
  }

  public confessIgnorance(mystery: string): string {
    console.log(`[NoIdeaLayer] Tutkitaan mysteeriä: "${mystery}"...`);
    return `${this.catchphrase} (Miksi koodeja kaatuu tai miksi tämä nappi tekee tuota? I assure you I've no idea, mutta mennään eteenpäin!)`;
  }

  public getStatus(): IgnoranceStatus {
    return {
      stateOfMind: this.stateOfMind,
      confusionLevel: this.confusionLevel,
      zenWisdom: this.zenWisdom,
      catchphrase: this.catchphrase
    };
  }
}

export const noIdea = NoIdeaLayer.getInstance();
