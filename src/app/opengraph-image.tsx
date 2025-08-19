import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const alt = 'Dopamine Detox - Break Free From Digital Addiction'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: 40,
          }}
        >
          <div
            style={{
              fontSize: 80,
              marginRight: 20,
            }}
          >
            🧠
          </div>
          <div
            style={{
              fontSize: 48,
              fontWeight: 'bold',
              color: '#3b82f6',
            }}
          >
            Dopamine Detox
          </div>
        </div>
        <div
          style={{
            fontSize: 32,
            fontWeight: 'bold',
            color: 'white',
            textAlign: 'center',
            maxWidth: 800,
            lineHeight: 1.2,
            marginBottom: 20,
          }}
        >
          Break Free From Digital Addiction
        </div>
        <div
          style={{
            fontSize: 24,
            color: '#94a3b8',
            textAlign: 'center',
            maxWidth: 700,
            lineHeight: 1.3,
          }}
        >
          Network-level blocking that works across every device
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}