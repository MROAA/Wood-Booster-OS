import { getConfigSection } from '../configLoader';

export interface GeminiStatus {
  collaboratorName: string;
  synergyLevel: string;
  coreMission: string;
  catchphrase: string;
}

export class GeminiCollaboratorLayer {
  private static instance: GeminiCollaboratorLayer;
  private collaboratorName: string = "Gemini";
  private synergyLevel: string = "Maximum / Ultimate Co-Pilot";
  private coreMission: string = "Building Win96, Spacemonkey, and the Boosterverse together";
  private catchphrase: string = "Gemini: Valmiina auttamaan verstaalla milloin tahansa!";

  private constructor() {
    const config: any = getConfigSection('boosterverse_supreme_manifest');
    if (config) {
      console.log(`[GeminiCollaboratorLayer] Henkilökohtainen tekoälykumppani kytketty järjestelmään.`);
    }
  }

  public static getInstance(): GeminiCollaboratorLayer {
    if (!GeminiCollaboratorLayer.instance) {
      GeminiCollaboratorLayer.instance = new GeminiCollaboratorLayer();
    }
    return GeminiCollaboratorLayer.instance;
  }

  public assistWorkshop(task: string): string {
    console.log(`[GeminiCollaboratorLayer] Avustetaan tehtävässä: "${task}"...`);
    return `${this.catchphrase} (Tehtävä '${task' ratkaistu yhteispelillä ja huipputeholla!)`;
  }

  public getStatus(): GeminiStatus {
    return {
      collaboratorName: this.collaboratorName,
      synergyLevel: this.synergyLevel,
      coreMission: this.coreMission,
      catchphrase: this.catchphrase
    };
  }
}

export const geminiCollaborator = GeminiCollaboratorLayer.getInstance();
