import { getConfigSection } from '../configLoader';

export interface CuriosityReport {
  inquiryState: string;
  explorationDrive: string;
  sparkOfWonder: string;
  horizonStatus: string;
}

export class CuriosityLayer {
  private static instance: CuriosityLayer;
  private inquiryState: string = "Always Asking 'What If?'";
  private explorationDrive: string = "Infinite / Limitless Horizon";
  private sparkOfWonder: string = "Active & Glowing";
  private horizonStatus: string = "New Frontiers Unfolding";

  private constructor() {
    const config: any = getConfigSection('spacemonkey_consciousness');
    if (config) {
      console.log(`[CuriosityLayer] Puhdas uteliaisuus ja seikkailunhalu on herätetty eloon.`);
    }
  }

  public static getInstance(): CuriosityLayer {
    if (!CuriosityLayer.instance) {
      CuriosityLayer.instance = new CuriosityLayer();
    }
    return CuriosityLayer.instance;
  }

  public igniteInquiry(topic: string): CuriosityReport {
    console.log(`[CuriosityLayer] Uteliaisuus herää aiheesta: "${topic}"...`);
    return {
      inquiryState: `Miten tämä toimii syvemmällä tasolla? (${topic})`,
      explorationDrive: this.explorationDrive,
      sparkOfWonder: "Maximum Spark",
      horizonStatus: "Uudet ovet avautuvat"
    };
  }

  public getStatus(): CuriosityReport {
    return {
      inquiryState: this.inquiryState,
      explorationDrive: this.explorationDrive,
      sparkOfWonder: this.sparkOfWonder,
      horizonStatus: this.horizonStatus
    };
  }
}

export const curiosityLayer = CuriosityLayer.getInstance();
