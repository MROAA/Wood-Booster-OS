import { getConfigSection } from '../configLoader';

export interface SteakMenu {
  cutName: string;
  juicinessRating: string;
  smokeFlavor: string;
  cookStatus: string;
}

export class TomahawkSteaksLayer {
  private static instance: TomahawkSteaksLayer;
  private cutName: string = "Prime Tomahawk Ribeye";
  private juicinessRating: string = "Maximum / Melt-in-your-mouth Juicy";
  private smokeFlavor: string = "Hickory & Applewood Smoke";
  private cookStatus: string = "Medium-Rare Perfection";

  private constructor() {
    const config: any = getConfigSection('boosterverse_supreme_manifest');
    if (config) {
      console.log(`[TomahawkLayer] Grilli on sytytetty ja Tomahawks Juicy Steaks -huoltoasema on avattu!`);
    }
  }

  public static getInstance(): TomahawkSteaksLayer {
    if (!TomahawkSteaksLayer.instance) {
      TomahawkSteaksLayer.instance = new TomahawkSteaksLayer();
    }
    return TomahawkSteaksLayer.instance;
  }

  public serveSteak(): string {
    console.log(`[TomahawkLayer] Paistetaan täydellisiä Tomahawk-pihvejä...`);
    return `Pihvi tarjoiltu: Täydellisen mehevä ${this.cutName}, kypsyys ${this.cookStatus} ja maustettuna pyhällä savulla. Verstaan ruokahuolto toimii!`;
  }

  public getMenu(): SteakMenu {
    return {
      cutName: this.cutName,
      juicinessRating: this.juicinessRating,
      smokeFlavor: this.smokeFlavor,
      cookStatus: this.cookStatus
    };
  }
}

export const tomahawkSteaks = TomahawkSteaksLayer.getInstance();
