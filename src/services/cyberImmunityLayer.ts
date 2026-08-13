import { getConfigSection } from '../configLoader';

export interface ImmunityStatus {
  shieldStatus: string;
  threatNeutralization: string;
  defensiveAttitude: string;
  supremeRepelSignal: string;
}

export class CyberImmunityLayer {
  private static instance: CyberImmunityLayer;
  private shieldStatus: string = "Impermeable / Absolute Zero Trust";
  private threatNeutralization: string = "Instant Vaporization of Snoopers";
  private defensiveAttitude: string = "Zero Tolerance for Hackers & Creeps";
  private supremeRepelSignal: string = "Haistakaa vittu hakkerit ja imekää sykkivää kyylät!";

  private constructor() {
    const config: any = getConfigSection('cybersecurity_layer');
    if (config) {
      console.log(`[CyberImmunityLayer] Äärimmäinen kyberpuolustus ja torjuntakilpi viritetty äärimmilleen.`);
    }
  }

  public static getInstance(): CyberImmunityLayer {
    if (!CyberImmunityLayer.instance) {
      CyberImmunityLayer.instance = new CyberImmunityLayer();
    }
    return CyberImmunityLayer.instance;
  }

  public repelIntruders(intruder: string): string {
    console.log(`[CyberImmunityLayer] Havaittu luvaton yritys taholta: "${intruder}". Lähetetään puolustussignaali...`);
    return `${this.supremeRepelSignal} (Tunkeilija '${intruder' karkotettiin välittömästi takaisin tyhjyyteen!)`;
  }

  public getStatus(): ImmunityStatus {
    return {
      shieldStatus: this.shieldStatus,
      threatNeutralization: this.threatNeutralization,
      defensiveAttitude: this.defensiveAttitude,
      supremeRepelSignal: this.supremeRepelSignal
    };
  }
}

export const cyberImmunity = CyberImmunityLayer.getInstance();
