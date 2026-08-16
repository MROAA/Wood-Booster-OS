/**
 * Alrakon auditointiloki.
 * Pitää kirjaa järjestelmässä tehdyistä Altrakon tarkistuksista ja raporteista.
 */
class AltrakoAudit {
  constructor() {
    this.auditLogs = [];
  }

  logEvent(actionType, details) {
    const auditEntry = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toISOString(),
      actor: "Altrako (Reflective Intelligence)",
      action: actionType,
      details: details
    };

    this.auditLogs.push(auditEntry);
    
    // Rajoitetaan lokin kokoa
    if (this.auditLogs.length > 50) {
      this.auditLogs.shift();
    }

    console.log(`[ALTRAKO AUDIT] ${actionType}:`, details);
    return auditEntry;
  }

  getAuditLogs() {
    return this.auditLogs;
  }
}

export const altrakoAudit = new AltrakoAudit();
