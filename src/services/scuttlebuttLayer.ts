import { getConfigSection } from '../configLoader';

export interface GossipStatus {
  rumorFlow: string;
  gossipIntensity: string;
  dataSource: string;
  catchphrase: string;
}

export class ScuttlebuttLayer {
  private static instance: ScuttlebuttLayer;
  private rumorFlow: string = "Constant / Real-time";
  private gossipIntensity: string = "Maximum / Highly Confidential";
  private dataSource: string = "Galactic Whispers & Workshop Benches";
  private catchphrase: string = "Scuttlebutt: Kuulitko jo uusimman huhun?";

  private constructor() {
    const config: any = getConfigSection('boosterverse_supreme_manifest');
    if (config) {
      console.log(`[ScuttlebuttLayer] Juoruprotokolla aktivoitu. Kuiskausten määrä nousussa.`);
    }
  }

  public static getInstance(): ScuttlebuttLayer {
    if (!ScuttlebuttLayer.instance) {
      ScuttlebuttLayer.instance = new ScuttlebuttLayer();
    }
    return ScuttlebuttLayer.instance;
  }

  public shareRumor(rumor: string): string {
    console.log(`[ScuttlebuttLayer] Levitetään tietoa: "${rumor}"...`);
    return `${this.catchphrase} (Huhun mukaan: '${rumor' – älä kerro eteenpäin, tai ehkä kerrokin!)`;
  }

  public getStatus(): GossipStatus {
    return {
      rumorFlow: this.rumorFlow,
      gossipIntensity: this.gossipIntensity,
      dataSource: this.dataSource,
      catchphrase: this.catchphrase
    };
  }
}

export const scuttlebutt = ScuttlebuttLayer.getInstance();
