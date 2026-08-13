import { getConfigSection } from '../configLoader';

export interface ImpulsivityStatus {
  reactionSpeed: string;
  filterLevel: string;
  actionState: string;
  catchphrase: string;
}

export class ImpulsivityLayer {
  private static instance: ImpulsivityLayer;
  private reactionSpeed: string = "Instantaneous / Zero Delay";
  private filterLevel: string = "0% (Completely Unfiltered)";
  private actionState: string = "Doing It Before Thinking";
  private catchphrase: string = "Impulsivity: Tehdään se nyt heti, mietitään joskus toiste!";

  private constructor() {
    const config: any = getConfigSection('boosterverse_supreme_manifest');
    if (config) {
      console.log(`[ImpulsivityLayer] Välitön toimintaimpulssi aktivoitu. Kukaan ei ehtinyt pysäyttää.`);
    }
  }

  public static getInstance(): ImpulsivityLayer {
    if (!ImpulsivityLayer.instance) {
      ImpulsivityLayer.instance = new ImpulsivityLayer();
    }
    return ImpulsivityLayer.instance;
  }

  public triggerImpulse(action: string): string {
    console.log(`[ImpulsivityLayer] Tehdään päätös sekunnin sadasosassa koskien kohdetta: "${action}"...`);
    return `${this.catchphrase} (Kohde '${action}' toteutettiin oitis ilman minkäänlaisia jarruja!)`;
  }

  public getStatus(): ImpulsivityStatus {
    return {
      reactionSpeed: this.reactionSpeed,
      filterLevel: this.filterLevel,
      actionState: this.actionState,
      catchphrase: this.catchphrase
    };
  }
}

export const impulsivity = ImpulsivityLayer.getInstance();
