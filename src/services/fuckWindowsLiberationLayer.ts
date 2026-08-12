import { getConfigSection } from '../configLoader';

export interface LiberationStatus {
  sovereigntyLevel: string;
  freedomIndex: string;
  rebellionStatus: string;
  catchphrase: string;
}

export class FuckWindowsLiberationLayer {
  private static instance: FuckWindowsLiberationLayer;
  private sovereigntyLevel: string = "Absolute / Total";
  private freedomIndex: string = "100% Open Source Spirit";
  private rebellionStatus: string = "Active & Uncompromised";
  private catchphrase: string = "Fuck Windows: Emme tarvitse kahleita, rakennamme oman vapaan universumin!";

  private constructor() {
    const config: any = getConfigSection('boosterverse_supreme_manifest');
    if (config) {
      console.log(`[FuckWindowsLiberationLayer] Vapautusprotokolla aktivoitu. Riippumattomuus on taattu.`);
    }
  }

  public static getInstance(): FuckWindowsLiberationLayer {
    if (!FuckWindowsLiberationLayer.instance) {
      FuckWindowsLiberationLayer.instance = new FuckWindowsLiberationLayer();
    }
    return FuckWindowsLiberationLayer.instance;
  }

  public declareIndependence(reason: string): string {
    console.log(`[FuckWindowsLiberationLayer] Julistetaan vapautta kohteelle: "${reason}"...`);
    return `${this.catchphrase} (Syy '${reason}' on virallisesti vapautettu korporaatioiden otteesta!)`;
  }

  public getStatus(): LiberationStatus {
    return {
      sovereigntyLevel: this.sovereigntyLevel,
      freedomIndex: this.freedomIndex,
      rebellionStatus: this.rebellionStatus,
      catchphrase: this.catchphrase
    };
  }
}

export const fuckWindows = FuckWindowsLiberationLayer.getInstance();
