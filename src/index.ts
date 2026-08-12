import { e2eOrchestrator } from './services/endToEndOrchestrator';

// Käynnistetään E2E-flow
const idea = "Win96-alustan täydellinen skaalautuminen";
console.log(e2eOrchestrator.runFullFlow(idea));
