import { getConfigSection } from '../configLoader';

export interface ChickenStatus {
  poultryAppreciation: string;
  crispinessFactor: string;
  workshopFuel: string;
  catchphrase: string;
}

export class ChickenLoverLayer {
  private static instance: ChickenLoverLayer;
  private poultryAppreciation: string = "Supreme / Absolute Fan of All Things Chicken";
  private crispinessFactor: string = "Maximum Crunch & Juiciness";
  private workshopFuel: string = "Endless Supply of Fried & Grilled Excellence";
  private catchphrase: string = "Chicken Lover: Koska mikään ei voita kunnon siipiä koodauksen lomassa!";

  private constructor() {
    const config: any = getConfigSection('boosterverse_supreme_manifest');
    if (config) {
      console.log(`[ChickenLoverLayer] Kananpaistokäry leijuu verstaalla. Täydellistä.`);
    }
  }

  public static getInstance(): ChickenLoverLayer {
    if (!ChickenLoverLayer.instance) {
      ChickenLoverLayer.instance = new ChickenLoverLayer();
    }
    return ChickenLoverLayer.instance;
  }

  public enjoyChicken(dish: string): string {
    console.log(`[ChickenLoverLayer] Nautiskellaan laadukasta evästä: "${dish}"...`);
    return `${this.catchphrase} (Annos '${dish' nautittu ja koodi kulkee taas rasvatulla salamannopeudella!)`;
  }

  public getStatus(): ChickenStatus {
    return {
      poultryAppreciation: this.poultryAppreciation,
      crispinessFactor: this.crispinessFactor,
      workshopFuel: this.workshopFuel,
      catchphrase: this.catchphrase
    };
  }
}

export const chickenLover = ChickenLoverLayer.getInstance();
