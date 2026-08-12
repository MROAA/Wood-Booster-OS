import { getConfigSection } from '../configLoader';

export interface TriplaneStatus {
  gameVibe: string;
  propellerRPM: number;
  dogfightChaos: string;
  catchphrase: string;
}

export class TriplaneTurmoilLayer {
  private static instance: TriplaneTurmoilLayer;
  private gameVibe: string = "Legendary Retro 9D Dogfight";
  private propellerRPM: number = 12000;
  private dogfightChaos: string = "Maximum Aerial Madness";
  private catchphrase: string = "Triplane Turmoil: Propellit laulaa ja taivaan sineen piirretään savurenkaita!";

  private constructor() {
    const config: any = getConfigSection('boosterverse_supreme_manifest');
    if (config) {
      console.log(`[TriplaneTurmoilLayer] Retrohenkinen lentotaisteluprotokolla käynnistetty. Väistä puita!`);
    }
  }

  public static getInstance(): TriplaneTurmoilLayer {
    if (!TriplaneTurmoilLayer.instance) {
      TriplaneTurmoilLayer.instance = new TriplaneTurmoilLayer();
    }
    return TriplaneTurmoilLayer.instance;
  }

  public flyMission(target: string): string {
    console.log(`[TriplaneTurmoilLayer] Lähdetään matalapennulle kohteena: "${target}"...`);
    return `${this.catchphrase} (Kohde '${target' pommitettu menestyksekkäästi tyylikkäällä kolmitasoisella koneella!)`;
  }

  public getStatus(): TriplaneStatus {
    return {
      gameVibe: this.gameVibe,
      propellerRPM: this.propellerRPM,
      dogfightChaos: this.dogfightChaos,
      catchphrase: this.catchphrase
    };
  }
}

export const triplaneTurmoil = TriplaneTurmoilLayer.getInstance();
