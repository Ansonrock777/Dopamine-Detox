import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 280,
          background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          // Maskable icons should fill the entire square
          borderRadius: '0px',
        }}
      >
        🧠
      </div>
    ),
    {
      width: 512,
      height: 512,
    }
  )
}