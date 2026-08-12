import { getConfigSection } from '../configLoader';

export interface LiroStatus {
  name: string;
  role: string;
  responseSpeed: string;
  reliabilityIndex: string;
}

export class LiroTheSupportLayer {
  private static instance: LiroTheSupportLayer;
  private name: string = "Liro the Support";
  private role: string = "Reliable Tech Support, Troubleshooting & Backup";
  private responseSpeed: string;
  private reliabilityIndex: string = "Absolute / 100% Dependable";

  private constructor() {
    const config: any = getConfigSection('yggdrasil_root_network');
    if (config) {
      console.log(`[LiroSupportLayer] Liro the Support on saapunut paikalle ja avannut työkalupakin!`);
    }
  }

  public static getInstance(): LiroTheSupportLayer {
    if (!LiroTheSupportLayer.instance) {
      LiroTheSupportLayer.instance = new LiroTheSupportLayer();
    }
    return LiroTheSupportLayer.instance;
  }

  public resolveIssue(issue: string): string {
    console.log(`[LiroSupportLayer] Liro ottaa kopin ongelmasta: "${issue}"...`);
    return `Liro the Support hymyilee ja kuittaa: "Ei hätää, hoidetaan tämä kuntoon!" Ongelma '${issue}' on ratkaistu ja järjestelmät rullaavat taas.`;
  }

  public getStatus(): LiroStatus {
    return {
      name: this.name,
      role: this.role,
      responseSpeed: "Instantaneous",
      reliabilityIndex: this.reliabilityIndex
    };
  }
}

export const liroTheSupport = LiroTheSupportLayer.getInstance();
