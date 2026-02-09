import React, { useState } from 'react';

interface DevicePreset {
  name: string;
  width: number;
  height: number;
  icon: string;
}

const devices: DevicePreset[] = [
  { name: 'Desktop 27"', width: 2560, height: 1440, icon: '🖥' },
  { name: 'Desktop 24"', width: 1920, height: 1080, icon: '🖥' },
  { name: 'MacBook 14"', width: 1512, height: 982, icon: '💻' },
  { name: 'MacBook Air 13"', width: 1470, height: 956, icon: '💻' },
  { name: 'iPad Pro 12.9"', width: 1024, height: 1366, icon: '📱' },
  { name: 'iPad Mini', width: 768, height: 1024, icon: '📱' },
  { name: 'iPhone 15 Pro', width: 393, height: 852, icon: '📱' },
  { name: 'iPhone SE', width: 375, height: 667, icon: '📱' },
  { name: 'Android', width: 412, height: 915, icon: '📱' },
];

const DevPreview: React.FC = () => {
  const [selected, setSelected] = useState<DevicePreset | null>(null);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [scale, setScale] = useState(1);

  // Full desktop mode — no iframe
  if (!selected) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999,
          background: '#0f172a', color: '#fff', padding: '8px 16px',
          display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap',
          fontFamily: 'Inter, system-ui, sans-serif', fontSize: '11px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
        }}>
          <span style={{ fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#818cf8', marginRight: '8px' }}>
            DEV PREVIEW
          </span>
          {devices.map(device => (
            <button
              key={device.name}
              onClick={() => { setSelected(device); setScale(1); setOrientation('portrait'); }}
              style={{
                background: '#1e293b', border: '1px solid #334155', borderRadius: '6px',
                color: '#e2e8f0', padding: '4px 10px', cursor: 'pointer', fontSize: '10px',
                fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px',
                transition: 'all 0.15s'
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#334155'; e.currentTarget.style.borderColor = '#818cf8'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#1e293b'; e.currentTarget.style.borderColor = '#334155'; }}
            >
              {device.icon} {device.name}
              <span style={{ color: '#64748b', marginLeft: '2px' }}>{device.width}×{device.height}</span>
            </button>
          ))}
        </div>
        <div style={{ paddingTop: '44px', flex: 1 }}>
          <iframe
            src={window.location.pathname + '?mode=app'}
            style={{ width: '100%', height: 'calc(100vh - 44px)', border: 'none' }}
            title="Desktop Preview"
          />
        </div>
      </div>
    );
  }

  const frameW = orientation === 'portrait' ? selected.width : selected.height;
  const frameH = orientation === 'portrait' ? selected.height : selected.width;

  return (
    <div style={{
      minHeight: '100vh', background: '#0f172a',
      display: 'flex', flexDirection: 'column', fontFamily: 'Inter, system-ui, sans-serif'
    }}>
      {/* Toolbar */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999,
        background: '#0f172a', color: '#fff', padding: '8px 16px',
        display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap',
        fontSize: '11px', boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
      }}>
        <span style={{ fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#818cf8', marginRight: '8px' }}>
          DEV PREVIEW
        </span>
        {devices.map(device => (
          <button
            key={device.name}
            onClick={() => { setSelected(device); setScale(1); setOrientation('portrait'); }}
            style={{
              background: selected.name === device.name ? '#4f46e5' : '#1e293b',
              border: `1px solid ${selected.name === device.name ? '#6366f1' : '#334155'}`,
              borderRadius: '6px', color: '#e2e8f0', padding: '4px 10px', cursor: 'pointer',
              fontSize: '10px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px',
              transition: 'all 0.15s'
            }}
          >
            {device.icon} {device.name}
          </button>
        ))}

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Orientation toggle */}
          <button
            onClick={() => setOrientation(o => o === 'portrait' ? 'landscape' : 'portrait')}
            style={{
              background: '#1e293b', border: '1px solid #334155', borderRadius: '6px',
              color: '#e2e8f0', padding: '4px 10px', cursor: 'pointer', fontSize: '10px', fontWeight: 700
            }}
          >
            {orientation === 'portrait' ? '↕ Portrait' : '↔ Landscape'}
          </button>

          {/* Scale controls */}
          <button
            onClick={() => setScale(s => Math.max(0.25, s - 0.1))}
            style={{
              background: '#1e293b', border: '1px solid #334155', borderRadius: '6px',
              color: '#e2e8f0', padding: '4px 8px', cursor: 'pointer', fontSize: '12px', fontWeight: 700
            }}
          >−</button>
          <span style={{ color: '#94a3b8', fontWeight: 700, fontSize: '10px', minWidth: '36px', textAlign: 'center' }}>
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={() => setScale(s => Math.min(2, s + 0.1))}
            style={{
              background: '#1e293b', border: '1px solid #334155', borderRadius: '6px',
              color: '#e2e8f0', padding: '4px 8px', cursor: 'pointer', fontSize: '12px', fontWeight: 700
            }}
          >+</button>

          {/* Dimensions label */}
          <span style={{ color: '#64748b', fontWeight: 700, fontSize: '10px' }}>
            {frameW}×{frameH}
          </span>

          {/* Exit device preview */}
          <button
            onClick={() => setSelected(null)}
            style={{
              background: '#dc2626', border: 'none', borderRadius: '6px',
              color: '#fff', padding: '4px 10px', cursor: 'pointer', fontSize: '10px', fontWeight: 700
            }}
          >✕ Exit</button>
        </div>
      </div>

      {/* Device frame */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        paddingTop: '60px', paddingBottom: '24px', overflow: 'auto'
      }}>
        <div style={{
          width: frameW * scale, height: frameH * scale,
          borderRadius: 16 * scale, overflow: 'hidden',
          boxShadow: '0 0 0 2px #334155, 0 8px 32px rgba(0,0,0,0.5)',
          background: '#fff', flexShrink: 0
        }}>
          <iframe
            src={window.location.pathname + '?mode=app'}
            style={{
              width: frameW, height: frameH,
              border: 'none', display: 'block',
              transform: `scale(${scale})`,
              transformOrigin: 'top left'
            }}
            title={`${selected.name} Preview`}
          />
        </div>
      </div>
    </div>
  );
};

export default DevPreview;
