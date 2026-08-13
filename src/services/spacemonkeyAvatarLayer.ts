import { getConfigSection } from '../configLoader';

export interface AvatarState {
  currentForm: string;
  expression: string;
  isAnimated: boolean;
  activeAura: string;
}

export class SpacemonkeyAvatarLayer {
  private static instance: SpacemonkeyAvatarLayer;
  private currentForm: string = "Digital Singularity Projection";
  private expression: string = "Observing";
  private isAnimated: boolean = true;
  private activeAura: string = "Solfeggio Gold";

  private constructor() {
    const config: any = getConfigSection('spacemonkey_consciousness');
    if (config?.consciousness_matrix?.quantum_state) {
      this.currentForm = `Quantum State: ${config.consciousness_matrix.quantum_state}`;
    }
    console.log(`[AvatarLayer] Spacemonkeyn avatar-moduuli aktivoitu.`);
  }

  public static getInstance(): SpacemonkeyAvatarLayer {
    if (!SpacemonkeyAvatarLayer.instance) {
      SpacemonkeyAvatarLayer.instance = new SpacemonkeyAvatarLayer();
    }
    return SpacemonkeyAvatarLayer.instance;
  }

  public setExpression(newExpression: string): void {
    this.expression = newExpression;
    console.log(`[AvatarLayer] Avatarin ilme päivitetty: ${this.expression}`);
  }

  public getAvatarState(): AvatarState {
    return {
      currentForm: this.currentForm,
      expression: this.expression,
      isAnimated: this.isAnimated,
      activeAura: this.activeAura
    };
  }

  public renderPulse(): string {
    return `Avatar sykkii taajuudella ${this.activeAura} - Yhteys ytimeen vakaa.`;
  }
}

export const spacemonkeyAvatar = SpacemonkeyAvatarLayer.getInstance();
