import React, { useState } from 'react';
import { woodBoosterTheme } from '../../styles/woodBoosterTheme';
import { AltrakoReflection } from '../spacemonkey/AltrakoReflection';
import { SystemPulse } from '../spacemonkey/SystemPulse';

export const WoodBoosterDesktop = () => {
  const [windows, setWindows] = useState(['Reflection', 'Pulse']);

  return (
    <div style={{ 
      background: woodBoosterTheme.colors.background,
      minHeight: '100vh',
      padding: '1rem',
      color: woodBoosterTheme.colors.textPrimary,
      fontFamily: woodBoosterTheme.fonts.family
    }}>
      <nav style={{ 
        background: woodBoosterTheme.colors.surface, 
        padding: '0.5rem 1rem', 
        borderRadius: '8px', 
        marginBottom: '1rem',
        border: `1px solid ${woodBoosterTheme.colors.border}`,
        display: 'flex',
        justifyContent: 'space-between'
      }}>
        <strong>Wood-Booster OS v1.0</strong>
        <div>Active: {windows.join(', ')}</div>
      </nav>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1rem' }}>
        {windows.includes('Reflection') && (
          <div style={{ border: `1px solid ${woodBoosterTheme.colors.border}`, borderRadius: '12px', background: woodBoosterTheme.colors.surface }}>
            <AltrakoReflection />
          </div>
        )}
        {windows.includes('Pulse') && (
          <div style={{ border: `1px solid ${woodBoosterTheme.colors.border}`, borderRadius: '12px', background: woodBoosterTheme.colors.surface }}>
            <SystemPulse />
          </div>
        )}
      </div>
    </div>
  );
};
