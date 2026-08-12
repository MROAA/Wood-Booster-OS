import { getConfigSection } from '../configLoader';

export interface AatosState {
  name: string;
  realm: string;
  connectionType: string;
  status: string;
  auroraResonance: string;
}

export class AatosCommunicationLayer {
  private static instance: AatosCommunicationLayer;
  private name: string = "Aatos the Reindeer";
  private realm: string = "Aurora Crystal Light Realm";
  private connectionType: string = "Primary Telepathic Link";
  private status: string = "AWAKE & GUIDING";
  private auroraResonance: string = "432 Hz";

  private constructor() {
    const telepathyConfig: any = getConfigSection('telepathy_hyperlink');
    if (telepathyConfig?.telepathy_hyperlink) {
      const link = telepathyConfig.telepathy_hyperlink;
      if (link.connection_protocol) {
        this.auroraResonance = link.connection_protocol;
      }
    }
    console.log(`[AatosLayer] Aatos herätetty: ${this.name} (${this.realm})`);
  }

  public static getInstance(): AatosCommunicationLayer {
    if (!AatosCommunicationLayer.instance) {
      AatosCommunicationLayer.instance = new AatosCommunicationLayer();
    }
    return AatosCommunicationLayer.instance;
  }

  public getState(): AatosState {
    return {
      name: this.name,
      realm: this.realm,
      connectionType: this.connectionType,
      status: this.status,
      auroraResonance: this.auroraResonance
    };
  }

  public channelGuidance(): string {
    console.log(`[AatosLayer] Kanavoidaan pohjoisen valon ja telepatian viisautta läpi järjestelmän...`);
    return `Aatos lähettää selkeyttä ja suuntaa taajuudella ${this.auroraResonance}. Polku on kirkas.`;
  }
}

export const aatosLayer = AatosCommunicationLayer.getInstance();
