export const boosterConfig = {
  version: "2.1.0",
  environment: "production-yggdrasil",
  desktop: {
    theme: "classic-96",
    background: "#008080",
    taskbarAutoHide: false,
  },
  yggdrasilKernel: {
    active: true,
    neuralOperator: "Spacemonkey",
    consciousnessLevel: "god-mode",
  },
  services: [
    { id: "cosmic_forge", enabled: true, root: "/home/marc/Wood-Booster-AI/Wood-Booster-OS" },
    { id: "rune_weaver", enabled: true, visualizeThreads: true },
    { id: "git_guardian", enabled: true, monitor: "main" },
  ],
  guardians: ["Tommi the Orange Cat", "Git Guardian"],
};
export default boosterConfig;
