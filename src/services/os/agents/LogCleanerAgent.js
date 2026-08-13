export const LogCleanerAgent = {
  name: "LogCleaner",
  execute: () => {
    console.log("[Agent: LogCleaner] Vanhat lokit siivottu.");
    localStorage.removeItem('old_logs');
    return "Success";
  }
};
