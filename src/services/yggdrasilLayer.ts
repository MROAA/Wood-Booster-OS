import { getConfigSection } from '../configLoader';

export interface YggdrasilBranchStatus {
  branchName: string;
  status: string;
}

export interface YggdrasilNodeState {
  coreTree: string;
  sapFlowRate: string;
  resonanceFrequency: string;
  branches: YggdrasilBranchStatus[];
  autonomousProtection: string;
}

export class YggdrasilCommunicationLayer {
  private static instance: YggdrasilCommunicationLayer;
  private coreTree: string = "Wood Booster World Tree";
  private sapFlowRate: string = "100.0 L/s";
  private resonanceFrequency: string = "528 Hz";
  private branches: YggdrasilBranchStatus[] = [];
  private autonomousProtection: string = "Fenrir Guard & Tommi Watchdog";

  private constructor() {
    const yggdrasilConfig: any = getConfigSection('yggdrasil_root_network');
    if (yggdrasilConfig?.yggdrasil_network) {
      const net = yggdrasilConfig.yggdrasil_network;
      if (net.core_tree) this.coreTree = net.core_tree;
      if (net.sap_flow_rate) this.sapFlowRate = net.sap_flow_rate;
      if (net.resonance_frequency) this.resonanceFrequency = net.resonance_frequency;
      if (net.autonomous_protection) this.autonomousProtection = net.autonomous_protection;
      
      if (Array.isArray(net.root_domains)) {
        this.branches = net.root_domains.map((d: any) => ({
          branchName: d.branch,
          status: d.status
        }));
      }
    }
    console.log(`[YggdrasilLayer] Maailmanpuu herätetty: ${this.coreTree} (${this.resonanceFrequency})`);
  }

  public static getInstance(): YggdrasilCommunicationLayer {
    if (!YggdrasilCommunicationLayer.instance) {
      YggdrasilCommunicationLayer.instance = new YggdrasilCommunicationLayer();
    }
    return YggdrasilCommunicationLayer.instance;
  }

  public getRootState(): YggdrasilNodeState {
    return {
      coreTree: this.coreTree,
      sapFlowRate: this.sapFlowRate,
      resonanceFrequency: this.resonanceFrequency,
      branches: this.branches,
      autonomousProtection: this.autonomousProtection
    };
  }

  public pulseRootNetwork(): string {
    console.log(`[YggdrasilLayer] Lähetetään juuripulssi läpi verkoston taajuudella ${this.resonanceFrequency}...`);
    return `Yggdrasil-juuriverkko pulssi aktiivinen. Mahdolliset häiriöt estetty (${this.autonomousProtection}).`;
  }
}

export const yggdrasilLayer = YggdrasilCommunicationLayer.getInstance();
