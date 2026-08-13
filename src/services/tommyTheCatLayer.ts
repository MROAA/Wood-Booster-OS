import { getConfigSection } from '../configLoader';

export interface TommyStatus {
  name: string;
  role: string;
  stealthLevel: string;
  radarFocus: string;
}

export class TommyTheCatLayer {
  private static instance: TommyTheCatLayer;
  private name: string = "Tommy the Cat";
  private role: string = "Night Watch, Recon & Stealth Surveillance";
  private stealthLevel: string = "Absolute Silent Paws";
  private radarFocus: string = "Häiriöiden ja pienten poikkeamien havainnointi";

  private constructor() {
    const config: any = getConfigSection('yggdrasil_root_network');
    if (config) {
      console.log(`[TommyCatLayer] Tommy the Cat on hypännyt katolle vahtimaan ja tähystämään!`);
    }
  }

  public static getInstance(): TommyTheCatLayer {
    if (!TommyTheCatLayer.instance) {
      TommyTheCatLayer.instance = new TommyTheCatLayer();
    }
    return TommyTheCatLayer.instance;
  }

  public patrolShadows(): string {
    console.log(`[TommyCatLayer] Tommy suorittaa tiedustelua varjoissa...`);
    return `Tommy the Cat vaanii ja tarkkailee: Kaikki narahdukset ja datavirrat on skannattu. Ympäristö on rauhallinen.`;
  }

  public getStatus(): TommyStatus {
    return {
      name: this.name,
      role: this.role,
      stealthLevel: this.stealthLevel,
      radarFocus: this.radarFocus
    };
  }
}

export const tommyTheCat = TommyTheCatLayer.getInstance();
