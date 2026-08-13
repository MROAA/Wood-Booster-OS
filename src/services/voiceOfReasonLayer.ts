import { getConfigSection } from '../configLoader';

export interface LogicEvaluationResult {
  isApproved: boolean;
  entropyRisk: string;
  reasoning: string;
  recommendedAction: string;
}

export class VoiceOfReasonLayer {
  private static instance: VoiceOfReasonLayer;
  private guardianTitle: string = "Järjen ääni (Voice of Reason)";
  private operatingMode: string = "Pragmatic Grounding";
  private stabilityThreshold: number = 0.95;

  private constructor() {
    const manifestConfig: any = getConfigSection('boosterverse_supreme_manifest');
    if (manifestConfig?.boosterverse_supreme_manifest) {
      console.log(`[VoiceOfReason] Logiikkakerros kytketty järjestelmän ytimeen.`);
    }
  }

  public static getInstance(): VoiceOfReasonLayer {
    if (!VoiceOfReasonLayer.instance) {
      VoiceOfReasonLayer.instance = new VoiceOfReasonLayer();
    }
    return VoiceOfReasonLayer.instance;
  }

  public evaluateAction(proposedAction: string, currentEntropy: number): LogicEvaluationResult {
    console.log(`[VoiceOfReason] Arvioidaan toimintoa: "${proposedAction}" (Entropia: ${currentEntropy})`);

    if (currentEntropy > this.stabilityThreshold) {
      return {
        isApproved: false,
        entropyRisk: "High",
        reasoning: "Toimenpide saattaa aiheuttaa liiallista todellisuuden vääristymää.",
        recommendedAction: "Vakauta järjestelmä 528 Hz resonanssilla ennen suoritusta."
      };
    }

    return {
      isApproved: true,
      entropyRisk: "Low / Optimal",
      reasoning: "Toimenpide on linjassa Win96-alustan ja fyysisen verstaan kanssa.",
      recommendedAction: "Jatka suoritusta normaalisti."
    };
  }

  public getStatus() {
    return {
      title: this.guardianTitle,
      mode: this.operatingMode,
      threshold: this.stabilityThreshold,
      status: "ACTIVE & BALANCED"
    };
  }
}

export const voiceOfReason = VoiceOfReasonLayer.getInstance();
