/**
 * Wood-Booster OS AgentManager
 * Hallinnoi autonomisia tausta-agentteja.
 */
class AgentManager {
  constructor() {
    this.agents = [];
  }

  registerAgent(agent) {
    this.agents.push(agent);
    console.log(`[OS] Agentti rekisteröity: ${agent.name}`);
  }

  runAll() {
    this.agents.forEach(agent => agent.execute());
  }
}

export const agentManager = new AgentManager();
