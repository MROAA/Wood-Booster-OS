import { getConfigSection } from '../configLoader';

export interface GitMasteryStatus {
  gitState: string;
  mergeConflicts: number;
  confidenceLevel: string;
  victoryQuote: string;
}

export class HelloGitLayer {
  private static instance: HelloGitLayer;
  private gitState: string = "Smooth Commits & Clean Push";
  private mergeConflicts: number = 0;
  private confidenceLevel: string = "100% / Master of the Repository";
  private victoryQuote: string = "Hello Git yup i got the hang of this!";

  private constructor() {
    const config: any = getConfigSection('boosterverse_supreme_manifest');
    if (config) {
      console.log(`[HelloGitLayer] Git-komennot lentävät nyt rutiinilla ja ilman virheitä!`);
    }
  }

  public static getInstance(): HelloGitLayer {
    if (!HelloGitLayer.instance) {
      HelloGitLayer.instance = new HelloGitLayer();
    }
    return HelloGitLayer.instance;
  }

  public celebrateGitFlow(): string {
    console.log(`[HelloGitLayer] Pusketaan koodia päähaaralle tyytyväisenä...`);
    return `${this.victoryQuote} Repositorio laulaa, commitit menevät läpi ekalla yrittämällä ja kehitys etenee kuin vettä vaan!`;
  }

  public getStatus(): GitMasteryStatus {
    return {
      gitState: this.gitState,
      mergeConflicts: this.mergeConflicts,
      confidenceLevel: this.confidenceLevel,
      victoryQuote: this.victoryQuote
    };
  }
}

export const helloGit = HelloGitLayer.getInstance();
