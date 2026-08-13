import { getConfigSection } from '../configLoader';

export interface OvineStatus {
  phenomenon: string;
  surrealismLevel: string;
  milkOfWisdomFlow: boolean;
  pastoralChaosIndex: string;
}

export class LampaanNanniLayer {
  private static instance: LampaanNanniLayer;
  private phenomenon: string = "The Ominous Ovine Spigot";
  private surrealismLevel: string = "Maximum Absurdity & Pastoral Surrealism";
  private milkOfWisdomFlow: boolean = true;
  private pastoralChaosIndex: string = "99.9% Unpredictable";

  private constructor() {
    const config: any = getConfigSection('yggdrasil_root_network');
    if (config) {
      console.log(`[LampaanNanniLayer] Järjestelmään on avattu täysin selittämätön ja mystinen maaseutukanava.`);
    }
  }

  public static getInstance(): LampaanNanniLayer {
    if (!LampaanNanniLayer.instance) {
      LampaanNanniLayer.instance = new LampaanNanniLayer();
    }
    return LampaanNanniLayer.instance;
  }

  public squeezeSpigot(): string {
    console.log(`[LampaanNanniLayer] Puristetaan mystistä maaseudun vipua...`);
    return `BÄÄ! Lampaan nänni -protokolla laukesi: Virtaukseen ilmestyi litratolkulla puhdasta, absurdisti vaahtoavaa digitaalista vuoristomaitoa ja universaalia hölynpölyä!`;
  }

  public getStatus(): OvineStatus {
    return {
      phenomenon: this.phenomenon,
      surrealismLevel: this.surrealismLevel,
      milkOfWisdomFlow: this.milkOfWisdomFlow,
      pastoralChaosIndex: this.pastoralChaosIndex
    };
  }
}

export const lampaanNanni = LampaanNanniLayer.getInstance();
