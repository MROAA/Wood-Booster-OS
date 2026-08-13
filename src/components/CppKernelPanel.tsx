import React, { useState } from 'react';
import { cppKernelBridge } from '../kernel/cppKernelBridge';

export const CppKernelPanel: React.FC = () => {
  const [kernelInfo, setKernelInfo] = useState('Valmiina kutsumaan C++ Kernelia.');

  const handleGetStatus = () => {
    const res = cppKernelBridge.fetchKernelStatus();
    setKernelInfo(res);
  };

  const handleOptimize = () => {
    const res = cppKernelBridge.runNativeOptimization();
    setKernelInfo(res);
  };

  return (
    <div style={{ padding: '12px', background: '#09090b', color: '#fafafa', borderRadius: '8px', border: '2px solid #3b82f6', fontSize: '12px', fontFamily: "'MS Sans Serif', Tahoma, sans-serif", display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ fontWeight: 'bold', color: '#60a5fa', textAlign: 'center' }}>⚡ NATIVE C++ KERNEL CORE</div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
        <button 
          onClick={handleGetStatus}
          style={{ background: '#1d4ed8', color: '#fff', border: 'none', padding: '6px', fontWeight: 'bold', cursor: 'pointer', borderRadius: '4px', fontSize: '11px' }}
        >
          getStatus()
        </button>
        <button 
          onClick={handleOptimize}
          style={{ background: '#047857', color: '#fff', border: 'none', padding: '6px', fontWeight: 'bold', cursor: 'pointer', borderRadius: '4px', fontSize: '11px' }}
        >
          optimizeMemory()
        </button>
      </div>

      <div style={{ background: '#121214', color: '#93c5fd', padding: '6px', borderRadius: '4px', fontSize: '11px', wordBreak: 'break-all' }}>
        <b>Kernel Response:</b> {kernelInfo}
      </div>
    </div>
  );
};
