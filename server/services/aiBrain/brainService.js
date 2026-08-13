class AIBrainService {
    constructor() {
        this.status = "ONLINE";
        this.activeAgents = [
            "Product Agent",
            "Workshop Agent",
            "Pricing Agent",
            "Marketing Agent",
            "CRM Agent"
        ];
    }

    getStatus() {
        return {
            status: this.status,
            agentsCount: this.activeAgents.length,
            agents: this.activeAgents
        };
    }

    async processAgentTask(agentName, taskData) {
        if (!this.activeAgents.includes(agentName)) {
            return { success: false, error: `Agenttia '${agentName}' ei löydy.` };
        }
        console.log(`[AIBrain] Agentti '${agentName}' käsittelee tehtävää...`);
        return {
            success: true,
            agent: agentName,
            result: `Tehtävä käsitelty onnistuneesti agentin toimesta.`,
            timestamp: new Date().toISOString()
        };
    }
}

export default new AIBrainService();
