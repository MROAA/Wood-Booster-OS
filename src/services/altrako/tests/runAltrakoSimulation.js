import { altrakoEngine } from '../../AltrakoEngine';

export const runAltrakoSimulation = () => {
  console.log("--- ALTRAKO 1.0 SIMULAATIO ALKAMASSA ---");

  const testDecisions = [
    { decision: "Päivitetään napin väri siniseksi", context: "UI" },
    { decision: "Luodaan uusi 50 moduulin järjestelmä kerralla", context: "Architecture" },
    { decision: "Poistetaan tietokannan suojaukset tilapäisesti", context: "Security" },
    { decision: "Lisätään yksinkertainen lokitustiedosto", context: "Logging" }
  ];

  testDecisions.forEach((item, index) => {
    console.log(`\nSimulaatioaskel ${index + 1}: Päätös -> "${item.decision}"`);
    const result = altrakoEngine.analyze(item);
    console.log(`-> Riskitaso: ${result.riskLevel}`);
    console.log(`-> Suositus: ${result.recommendation}`);
  });

  const health = altrakoEngine.performHealthCheck();
  console.log("\n--- JÄRJESTELMÄN HEALTH CHECK ---");
  console.log(`Status: ${health.status}`);
  console.log(`Viesti: ${health.message}`);
  console.log("-----------------------------------------");
};
