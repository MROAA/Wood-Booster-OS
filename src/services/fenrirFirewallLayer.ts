import { getConfigSection } from '../configLoader';

export interface FirewallPacket {
  source: string;
  destination: string;
  payloadSizeMb: number;
  quantumSigned: boolean;
}

export interface FirewallStatus {
  guardian: string;
  domain: string;
  priority: number;
  activeStatus: string;
}

export class FenrirFirewallLayer {
  private static instance: FenrirFirewallLayer;
  private guardianName: string = "Fenrir";
  private domain: string = "Quantum Firewall & Packet Filter";
  private priority: number = 4;
  private activeStatus: string = "ARMED & SHIELDED";

  private constructor() {
    const routingConfig: any = getConfigSection('agent_routing');
    if (routingConfig?.agent_routing?.sub_agents) {
      const fenrirAgent = routingConfig.agent_routing.sub_agents.find((a: any) => a.id === 'fenrir');
      if (fenrirAgent) {
        this.domain = fenrirAgent.domain;
        this.priority = fenrirAgent.priority;
      }
    }
    console.log(`[FenrirLayer] Kvanttipalomuuri aktivoitu: ${this.domain} (Prioriteetti: ${this.priority})`);
  }

  public static getInstance(): FenrirFirewallLayer {
    if (!FenrirFirewallLayer.instance) {
      FenrirFirewallLayer.instance = new FenrirFirewallLayer();
    }
    return FenrirFirewallLayer.instance;
  }

  public inspectPacket(packet: FirewallPacket): boolean {
    console.log(`[FenrirLayer] Tarkastetaan paketti kohteesta ${packet.source} kohteeseen ${packet.destination}...`);
    
    if (!packet.quantumSigned) {
      console.warn(`[FenrirLayer] VAROITUS: Pakettia ei ole kvanttiallekirjoitettu! Suodatettu pois.`);
      return false;
    }

    console.log(`[FenrirLayer] Paketti läpäisi tarkastuksen turvallisesti.`);
    return true;
  }

  public getStatus(): FirewallStatus {
    return {
      guardian: this.guardianName,
      domain: this.domain,
      priority: this.priority,
      activeStatus: this.activeStatus
    };
  }
}

export const fenrirFirewall = FenrirFirewallLayer.getInstance();
