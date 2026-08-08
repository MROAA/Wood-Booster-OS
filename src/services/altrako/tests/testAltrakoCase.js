import { altrakoBridge } from '../altrakoBridge';
import { altrakoAudit } from '../audit/altrakoAudit';

export const runArchitectureCaseTest = () => {
  console.log("--- TESTI: PRD Case 1 — Arkkitehtuurimuutos ---");
  
  // Spacemonkeyn iso päätös (Case 1 PRD:stä)
  const spacemonkeyDecision = "Luodaan uusi 50 moduulin järjestelmä kerralla.";
  
  // Kutsutaan siltaa
  const response = altrakoBridge.consultAltrako(spacemonkeyDecision, "Architecture Scale-up");

  console.log("Spacemonkey sanoi:", spacemonkeyDecision);
  console.log("Altrakon vastaus:", JSON.stringify(response, null, 2));
  console.log("Auditointilokit yhteensä:", altrakoAudit.getAuditLogs().length);
  
  return response;
};
