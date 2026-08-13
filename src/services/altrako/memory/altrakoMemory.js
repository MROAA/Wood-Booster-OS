/**
 * Altrakon pysyvä muistikerros (Versio 1.0).
 * Tallentaa analyysit localStorageen, jotta historia säilyy istuntojen yli.
 */
class AltrakoMemory {
  constructor() {
    this.storageKey = 'altrako_memory_log_v1';
    this.memoryLog = this.loadFromStorage();
  }

  loadFromStorage() {
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(this.storageKey);
        return stored ? JSON.parse(stored) : [];
      }
    } catch (e) {
      console.error("[Altrako Memory] Virhe muistin latauksessa:", e);
    }
    return [];
  }

  saveToStorage() {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(this.storageKey, JSON.stringify(this.memoryLog));
      }
    } catch (e) {
      console.error("[Altrako Memory] Virhe muistin tallennuksessa:", e);
    }
  }

  saveAnalysis(decision, analysisResult) {
    const entry = {
      timestamp: new Date().toISOString(),
      decision,
      analysis: analysisResult
    };
    
    this.memoryLog.push(entry);
    
    // Pidetään muisti hallittavana (esim. viimeiset 50 analyysia)
    if (this.memoryLog.length > 50) {
      this.memoryLog.shift();
    }

    this.saveToStorage();
  }

  getHistory() {
    return this.memoryLog;
  }

  clearHistory() {
    this.memoryLog = [];
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.storageKey);
    }
  }

  getLastDecisionContext() {
    return this.memoryLog.length > 0 
      ? this.memoryLog[this.memoryLog.length - 1] 
      : null;
  }
}

export const altrakoMemory = new AltrakoMemory();
