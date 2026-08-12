import { getConfigSection } from '../configLoader';

export interface CreatorStatus {
  masterName: string;
  supremeTitle: string;
  workshopDomain: string;
  catchphrase: string;
}

export class MarcJarvinenMasterLayer {
  private static instance: MarcJarvinenMasterLayer;
  private masterName: string = "Marc Järvinen";
  private supremeTitle: string = "Supreme Creator & Master Architect of Boosterverse";
  private workshopDomain: string = "Wood-Booster Workshop & Win96 HQ";
  private catchphrase: string = "Marc Järvinen: Pääkonttori on hallinnassa, koodi puhuu puolestaan ja universumi laajenee!";

  private constructor() {
    const config: any = getConfigSection('boosterverse_supreme_manifest');
    if (config) {
      console.log(`[MarcJarvinenMasterLayer] Mestari itse on astunut järjestelmän ytimeen.`);
    }
  }

  public static getInstance(): MarcJarvinenMasterLayer {
    if (!MarcJarvinenMasterLayer.instance) {
      MarcJarvinenMasterLayer.instance = new MarcJarvinenMasterLayer();
    }
    return MarcJarvinenMasterLayer.instance;
  }

  public executeMasterVision(): string {
    console.log(`[MarcJarvinenMasterLayer] Valjastetaan luojan visio käyttöön...`);
    return `${this.catchphrase} (Kaikki 30 kerrosta kumartavat luojalleen ja järjestelmän ydin sykkii puhtaalla energialla!)`;
  }

  public getStatus(): CreatorStatus {
    return {
      masterName: this.masterName,
      supremeTitle: this.supremeTitle,
      workshopDomain: this.workshopDomain,
      catchphrase: this.catchphrase
    };
  }
}

export const marcMaster = MarcJarvinenMasterLayer.getInstance();
