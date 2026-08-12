import { getConfigSection } from '../configLoader';

export interface UniverseStatus {
  creationPower: string;
  existentialApathy: string;
  galaxiesSpawned: number;
  supremeManifesto: string;
}

export class TehdaanUniversumiLayer {
  private static instance: TehdaanUniversumiLayer;
  private creationPower: string = "Infinite / Accidental Big Bang";
  private existentialApathy: string = "100% Carefree Omnipotence";
  private galaxiesSpawned: number = 420000;
  private supremeManifesto: string = "Tehdään vaikka saatana universumi mitä minä välitän!";

  private constructor() {
    const config: any = getConfigSection('boosterverse_supreme_manifest');
    if (config) {
      console.log(`[TehdaanUniversumiLayer] Uusi universumi pärähti käyntiin sivutuotteena. Ketään ei kiinnosta, mutta hieno tuli!`);
    }
  }

  public static getInstance(): TehdaanUniversumiLayer {
    if (!TehdaanUniversumiLayer.instance) {
      TehdaanUniversumiLayer.instance = new TehdaanUniversumiLayer();
    }
    return TehdaanUniversumiLayer.instance;
  }

  public spawnNewUniverse(): string {
    console.log(`[TehdaanUniversumiLayer] Kohautetaan olkapäitä ja luodaan uusi kosmos...`);
    return `${this.supremeManifesto} Win96-alustan taustalle syntyi juuri triljoona uutta aurinkokuntaa, koska mikäs siinä kun vauhtiin päästiin!`;
  }

  public getStatus(): UniverseStatus {
    return {
      creationPower: this.creationPower,
      existentialApathy: this.existentialApathy,
      galaxiesSpawned: this.galaxiesSpawned,
      supremeManifesto: this.supremeManifesto
    };
  }
}

export const tehdaanUniversumi = TehdaanUniversumiLayer.getInstance();
