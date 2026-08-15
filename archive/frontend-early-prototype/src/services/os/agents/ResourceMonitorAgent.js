export const ResourceMonitorAgent = {
  name: "ResourceMonitor",
  execute: () => {
    const usage = Math.floor(Math.random() * 100);
    console.log(`[Agent: ResourceMonitor] Järjestelmän kuormitus: ${usage}%`);
    return usage;
  }
};
