import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'legalops.club — connect. learn. build.'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#F5F1E8',
          color: '#111111',
          position: 'relative',
          overflow: 'hidden',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ position: 'absolute', right: -90, top: -105, width: 300, height: 300, border: '3px solid #E88A6A', borderRadius: 150, opacity: 0.42 }} />
        <div style={{ position: 'absolute', left: -150, bottom: -90, width: 520, height: 180, borderTop: '3px solid #E88A6A', borderRight: '3px solid #E88A6A', borderTopRightRadius: 90, opacity: 0.42 }} />

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', fontSize: 96, fontWeight: 500, letterSpacing: '-7px' }}>
            <span>legalops</span><span style={{ color: '#E88A6A' }}>.</span><span>club</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 34, letterSpacing: '2px' }}>
            <span>connect</span><span style={{ color: '#E88A6A' }}>.</span>
            <span>learn</span><span style={{ color: '#E88A6A' }}>.</span>
            <span>build</span><span style={{ color: '#E88A6A' }}>.</span>
          </div>
        </div>
      </div>
    ),
    size,
  )
}
