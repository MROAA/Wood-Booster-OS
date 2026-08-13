import { getConfigSection } from '../configLoader';

export interface OlliStatus {
  name: string;
  neighbourhoodRole: string;
  eccentricityIndex: string;
  unexpectedWisdom: boolean;
}

export class OlliTheOddNeighbourLayer {
  private static instance: OlliTheOddNeighbourLayer;
  private name: string = "Olli the odd neighbour";
  private neighbourhoodRole: string = "Unpredictable Perspective & Backyard Philosopher";
  private eccentricityIndex: string;
  private unexpectedWisdom: boolean = true;

  private constructor() {
    const config: any = getConfigSection('yggdrasil_root_network');
    if (config) {
      console.log(`[OlliNeighbourLayer] Olli the odd neighbour ilmestyi aitaa vasten nojailemaan ja jutustelemaan!`);
    }
  }

  public static getInstance(): OlliTheOddNeighbourLayer {
    if (!OlliTheOddNeighbourLayer.instance) {
      OlliTheOddNeighbourLayer.instance = new OlliTheOddNeighbourLayer();
    }
    return OlliTheOddNeighbourLayer.instance;
  }

  public dropOddWisdom(topic: string): string {
    console.log(`[OlliNeighbourLayer] Olli mutisee jotain odottamatonta aiheesta: "${topic}"...`);
    return `Olli the odd neighbour raaputtaa päätään ja tuumaa: "No hei, tiedätsä mitä? Jos sitä tosta vähän kääntää ja katsoo nurkan takaa, niin koko ongelma katoaa." (Aihe: ${topic})`;
  }

  public getStatus(): OlliStatus {
    return {
      name: this.name,
      neighbourhoodRole: this.neighbourhoodRole,
      eccentricityIndex: "High / Delightfully Peculiar",
      unexpectedWisdom: this.unexpectedWisdom
    };
  }
}

export const olliTheOddNeighbour = OlliTheOddNeighbourLayer.getInstance();
