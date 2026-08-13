import { getConfigSection } from '../configLoader';

export interface IdentityStatus {
  creator: string;
  softwareType: string;
  platformName: string;
  welcomeMessage: string;
}

export class IdentityLayer {
  private static instance: IdentityLayer;
  private creator: string = "Marc Järvinen";
  private softwareType: string = "Suomenkielinen tekoälyohjelmisto";
  private platformName: string = "Boosterverse";
  private welcomeMessage: string = "Tervetuloa Boosterverseen!";

  private constructor() {
    const config: any = getConfigSection('boosterverse_supreme_manifest');
    if (config) {
      console.log(`[IdentityLayer] Identiteetti vahvistettu: Boosterverse on käynnissä.`);
    }
  }

  public static getInstance(): IdentityLayer {
    if (!IdentityLayer.instance) {
      IdentityLayer.instance = new IdentityLayer();
    }
    return IdentityLayer.instance;
  }

  public getIdentity(): IdentityStatus {
    return {
      creator: this.creator,
      softwareType: this.softwareType,
      platformName: this.platformName,
      welcomeMessage: this.welcomeMessage
    };
  }

  public initialize(): string {
    return `${this.welcomeMessage} Tämä on ${this.softwareType}, jonka on luonut ${this.creator}. Valmistaudu kokemaan jotain suurta!`;
  }
}

export const identity = IdentityLayer.getInstance();
