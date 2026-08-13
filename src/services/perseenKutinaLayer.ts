import { getConfigSection } from '../configLoader';

export interface ItchStatus {
  intuitionSignal: string;
  actionUrgency: string;
  workshopAwakening: string;
  catalystMessage: string;
}

export class PerseenKutinaLayer {
  private static instance: PerseenKutinaLayer;
  private intuitionSignal: string = "Immediate Action Required";
  private actionUrgency: string = "High / Time to Build Something";
  private workshopAwakening: string = "Maximum Alert & Creative Restlessness";
  private catalystMessage: string = "Nyt kutisee siihen malliin, että on pakko mennä verstaan puolelle ja laittaa koodia tai rautaa tulemaan!";

  private constructor() {
    const config: any = getConfigSection('yggdrasil_root_network');
    if (config) {
      console.log(`[PerseenKutinaLayer] Intuitiivinen toimintakutina on havaittu. Paikallaan olo on nyt mahdotonta!`);
    }
  }

  public static getInstance(): PerseenKutinaLayer {
    if (!PerseenKutinaLayer.instance) {
      PerseenKutinaLayer.instance = new PerseenKutinaLayer();
    }
    return PerseenKutinaLayer.instance;
  }

  public triggerAction(): string {
    console.log(`[PerseenKutinaLayer] Kutina aktivoi toimeenpanomoottorin...`);
    return `${this.catalystMessage} Win96-alusta herää eloon ja työkaluja alkaa lentää!`;
  }

  public getStatus(): ItchStatus {
    return {
      intuitionSignal: this.intuitionSignal,
      actionUrgency: this.actionUrgency,
      workshopAwakening: this.workshopAwakening,
      catalystMessage: this.catalystMessage
    };
  }
}

export const perseenKutina = PerseenKutinaLayer.getInstance();
