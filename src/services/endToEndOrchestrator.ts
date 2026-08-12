import { win96Visuals } from './win96VisualLayer';
import { copyPaste } from './copyPasteLayer';
import { marcMaster } from './marcJarvinenMasterLayer';
import { fuckWindows } from './fuckWindowsLiberationLayer';
import { mathSolver } from './mathSolverLayer';
import { mathLanguage } from './mathLanguageLayer';

export class EndToEndOrchestrator {
  private static instance: EndToEndOrchestrator;

  private constructor() {
    console.log(`[EndToEndOrchestrator] End-to-End ketju on kytketty.`);
  }

  public static getInstance(): EndToEndOrchestrator {
    if (!EndToEndOrchestrator.instance) {
      EndToEndOrchestrator.instance = new EndToEndOrchestrator();
    }
    return EndToEndOrchestrator.instance;
  }

  public runFullFlow(inputIdea: string): string {
    // 1. Renderöidään käyttöliittymä
    console.log(win96Visuals.renderDesktop());
    
    console.log(`--- [E2E] Käynnistetään full-stack suoritus: "${inputIdea}" ---`);
    
    // 2. Vapautus, logiikka ja toteutus
    fuckWindows.declareIndependence("Rajoitteet");
    mathLanguage.translateReality(inputIdea);
    mathSolver.solve(inputIdea);
    copyPaste.duplicateIdea(inputIdea);
    marcMaster.executeMasterVision();
    
    return `[E2E SUCCESS] Idea "${inputIdea}" on kulkenut läpi koko stackin.`;
  }
}

export const e2eOrchestrator = EndToEndOrchestrator.getInstance();
