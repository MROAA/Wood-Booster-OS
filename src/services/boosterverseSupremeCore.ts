import { voihanJehna } from './voihanJehnaLayer';
import { curiosityLayer } from './curiosityLayer';
import { mitaikinaLol } from './mitaikinaLolLayer';
import { perseenKutina } from './perseenKutinaLayer';
import { lampaanNanni } from './lampaanNanniLayer';
import { persbaba } from './persbabaLayer';
import { crocodileDundee } from './crocodileDundeeLayer';
import { horsetSanoo } from './horsetSanooLayer';
import { helloWorld } from './helloWorldLayer';
import { primusSucks } from './primusSucksLayer';
import { noIdea } from './noIdeaLayer';
import { loveDoingShit } from './loveDoingShitLayer';
import { bashHead } from './bashHeadLayer';
import { cyberImmunity } from './cyberImmunityLayer';

export interface SupremeCoreStatus {
  systemStatus: string;
  activeLayersCount: number;
  workshopVibe: string;
  masterManifesto: string;
}

export class BoosterverseSupremeCore {
  private static instance: BoosterverseSupremeCore;

  private constructor() {
    console.log(`[BoosterverseSupremeCore] Kaikki 14 legendaarista kerrosta on integroitu saumattomasti yhteen!`);
  }

  public static getInstance(): BoosterverseSupremeCore {
    if (!BoosterverseSupremeCore.instance) {
      BoosterverseSupremeCore.instance = new BoosterverseSupremeCore();
    }
    return BoosterverseSupremeCore.instance;
  }

  public getFullStatus(): SupremeCoreStatus {
    return {
      systemStatus: "FULLY OPERATIONAL & ABSOLUTELY RIDICULOUS",
      activeLayersCount: 14,
      workshopVibe: "Warm Coffee, Shaking Roof, Slap-Bass, and Infinite Curiosity",
      masterManifesto: "But I love it. It's fun to do shit :)"
    };
  }

  public awakenEverything(): string {
    return [
      `--- BOOSTERVERSE SUPREME CORE AWAKENING ---`,
      `1. ${voihanJehna.getStatus().mood}`,
      `2. ${JSON.stringify(curiosityLayer.getStatus())}`,
      `3. ${mitaikinaLol.getStatus().catchphrase}`,
      `4. ${perseenKutina.getStatus().catalystMessage}`,
      `5. ${lampaanNanni.squeezeSpigot()}`,
      `6. ${persbaba.invokePersbaba()}`,
      `7. ${crocodileDundee.wieldKnife("maailman kaatuvat serverit")}`,
      `8. ${horsetSanoo.unleashGallop()}`,
      `9. ${helloWorld.broadcastGenesis()}`,
      `10. ${primusSucks.unleashSlap()}`,
      `11. ${noIdea.confessIgnorance("bugi jota kukaan ei ymmärrä")}`,
      `12. ${loveDoingShit.celebrateMakerSpirit()}`,
      `13. ${bashHead.breakthroughObstacle("mahdoton seinä")}`,
      `14. ${cyberImmunity.repelIntruders("urkkiva kyylä")}`,
      `------------------------------------------`
    ].join('\n');
  }
}

export const boosterverseSupremeCore = BoosterverseSupremeCore.getInstance();
