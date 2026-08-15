import { altrakoEngine } from '../AltrakoEngine';
import { ALTRAKO_IDENTITY } from '../../data/spacemonkey/altrakoIdentity';
import { altrakoAudit } from './audit/altrakoAudit'; // Tuodaan auditointi

/**
 * Spacemonkey & Altrako Bridge.
 * Sisältää nyt auditoinnin jokaiselle reflektoinnille.
 */
class AltrakoBridge {
  constructor() {
    this.identity = ALTRAKO_IDENTITY;
  }

  consultAltrako(decision, context = "Wood-Booster HQ") {
    // 1. Tehdään analyysi
    const analysisResult = altrakoEngine.analyze({
      decision,
      context
    });

    // 2. Auditoidaan tapahtuma (PRD-menestyskriteeri)
    altrakoAudit.logEvent("CONSULTATION_REQUESTED", {
      decision,
      context,
      riskLevel: analysisResult.riskLevel
    });

    return {
      source: "Spacemonkey Operator",
      responder: this.identity.name,
      role: this.identity.role,
      status: "Reflected & Audited",
      reflection: analysisResult
    };
  }
}

export const altrakoBridge = new AltrakoBridge();
