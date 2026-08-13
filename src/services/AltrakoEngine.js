import { ALTRAKO_IDENTITY } from '../data/spacemonkey/altrakoIdentity';
import { altrakoMemory } from './altrako/memory/altrakoMemory';
import { alternativeReasoning } from './altrako/reasoning/alternativeReasoning';

export class AltrakoEngine {
  constructor() {
    this.identity = ALTRAKO_IDENTITY;
    this.memory = altrakoMemory;
    this.reasoning = alternativeReasoning;
  }

  analyze(input) {
    const { decision, context } = input || {};
    const riskEval = this.reasoning.evaluateRisk(decision);

    const result = {
      perspective: this.identity.name,
      role: this.identity.role,
      targetDecision: decision || "Ei määriteltyä päätöstä",
      context: context || "Yleinen järjestelmätaso",
      riskLevel: riskEval.level,
      analysis: [
        `Tunnistettu riskiluokka: ${riskEval.level}`,
        `Huomio: ${riskEval.warning}`,
        `Tasapaino: ${riskEval.alternative}`
      ],
      recommendation: riskEval.level === "KORKEA" 
        ? "Jarruta! Suosittelen pilkkomaan tehtävän pienempiin osiin."
        : "Jatka eteenpäin nykyisellä suunnitelmalla."
    };

    this.memory.saveAnalysis(decision, result);
    return result;
  }

  getMemoryHistory() {
    return this.memory.getHistory();
  }

  /**
   * Altrako 1.0: Tarkistaa järjestelmän yleisen terveyden aiemman historian perusteella.
   */
  performHealthCheck() {
    const history = this.memory.getHistory();
    if (history.length === 0) {
      return { status: "OPTIMAL", message: "Ei aikaisempia päätöksiä, järjestelmä on puhtaalla pohjalla." };
    }

    const highRisks = history.filter(item => item.analysis.riskLevel === "KORKEA");
    
    if (highRisks.length > 2) {
      return { 
        status: "WARNING", 
        message: `Hälytys: Viimeisten päätösten joukossa on ${highRisks.length} korkean riskin merkintää. Suosittelen refaktorointitaukoa.` 
      };
    }

    return { 
      status: "STABLE", 
      message: "Järjestelmän pulssi on vakaa. Riskitaso hallinnassa." 
    };
  }
}

export const altrakoEngine = new AltrakoEngine();
