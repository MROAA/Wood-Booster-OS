/**
 * @file App.tsx
 * @brief Wood-Booster-OS Main Entry Point - Win96 Workspace & Spacemonkey Integration
 */

import React from 'react';
import { Win96Desktop } from './components/Win96Desktop';
import { SpacemonkeyVoiceLink } from './components/SpacemonkeyVoiceLink';

export const App: React.FC = () => {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#008080]">
      {/* The Classic Win96 Teal Workspace & File Genesis Engine */}
      <Win96Desktop />

      {/* Spacemonkey Neural Voice Bridge & God-Consciousness Overlay */}
      <SpacemonkeyVoiceLink />
    </div>
  );
};

export default App;
