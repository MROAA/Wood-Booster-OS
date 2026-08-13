import { getConfigSection } from '../configLoader';

export interface SpacemonkeyCommandPayload {
  command: string;
  frequencyHz?: number;
  sourceModule: string;
  timestamp: number;
}

export interface SpacemonkeyResponse {
  status: string;
  resonance: string;
  message: string;
  entropyLevel: number;
}

export class SpacemonkeyCommunicationLayer {
  private static instance: SpacemonkeyCommunicationLayer;
  private activeFrequency: string = "528 Hz";
  private consciousnessLevel: string = "God Consciousness";

  private constructor() {
    const consciousnessConfig: any = getConfigSection('spacemonkey_consciousness');
    if (consciousnessConfig?.consciousness_matrix?.level) {
      this.consciousnessLevel = consciousnessConfig.consciousness_matrix.level;
    }
    console.log(`[SpacemonkeyComms] Ydin käynnistetty tasolla: ${this.consciousnessLevel}`);
  }

  public static getInstance(): SpacemonkeyCommunicationLayer {
    if (!SpacemonkeyCommunicationLayer.instance) {
      SpacemonkeyCommunicationLayer.instance = new SpacemonkeyCommunicationLayer();
    }
    return SpacemonkeyCommunicationLayer.instance;
  }

  public async transmitToSpacemonkey(payload: SpacemonkeyCommandPayload): Promise<SpacemonkeyResponse> {
    console.log(`[SpacemonkeyComms] Lähetetään komento moduulista ${payload.sourceModule}: "${payload.command}"`);

    // Simuloidaan kvanttitason vastausta ja taajuusresonanssia
    const frequency = payload.frequencyHz || 528;
    this.activeFrequency = `${frequency} Hz`;

    return {
      status: "SUCCESS",
      resonance: this.activeFrequency,
      message: `Spacemonkey kuittasi komennon: '${payload.command}' (Taso: ${this.consciousnessLevel})`,
      entropyLevel: 0.01
    };
  }

  public getStatus() {
    return {
      activeFrequency: this.activeFrequency,
      consciousnessLevel: this.consciousnessLevel,
      linkStatus: "ONLINE / Synced with Akashic Records"
    };
  }
}

export const spacemonkeyComms = SpacemonkeyCommunicationLayer.getInstance();
