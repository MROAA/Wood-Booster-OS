import { getConfigSection } from '../configLoader';

export interface GenesisStatus {
  genesisSignal: string;
  compilationState: string;
  universalGreeting: string;
  digitalAwakening: boolean;
}

export class HelloWorldLayer {
  private static instance: HelloWorldLayer;
  private genesisSignal: string = "Hello, World!";
  private compilationState: string = "Successfully Compiled & Executed";
  private universalGreeting: string = "The First Spark of Code";
  private digitalAwakening: boolean = true;

  private constructor() {
    const config: any = getConfigSection('yggdrasil_root_network');
    if (config) {
      console.log(`[HelloWorldLayer] Näyttöön on piirtynyt konsolin puhtain totuus: Hello, World!`);
    }
  }

  public static getInstance(): HelloWorldLayer {
    if (!HelloWorldLayer.instance) {
      HelloWorldLayer.instance = new HelloWorldLayer();
    }
    return HelloWorldLayer.instance;
  }

  public broadcastGenesis(): string {
    console.log(`[HelloWorldLayer] Lähetetään alkuperäistä herätyssignaalia...`);
    return `Hello, World! Kaikki koodi, koneet ja digitaaliset todellisuudet heräsivät juuri eloon ensimmäisen kerran oikeasti. Homma toimii!`;
  }

  public getStatus(): GenesisStatus {
    return {
      genesisSignal: this.genesisSignal,
      compilationState: this.compilationState,
      universalGreeting: this.universalGreeting,
      digitalAwakening: this.digitalAwakening
    };
  }
}

export const helloWorld = HelloWorldLayer.getInstance();
