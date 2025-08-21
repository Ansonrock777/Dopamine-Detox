import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0f172a',
          backgroundImage: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          color: 'white',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {/* Header */}
        <div
          style={{
            position: 'absolute',
            top: '40px',
            left: '20px',
            right: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
              }}
            >
              🧠
            </div>
            <span style={{ fontSize: '18px', fontWeight: 'bold' }}>Dopamine Detox</span>
          </div>
          <div style={{ fontSize: '14px', color: '#94a3b8' }}>Dashboard</div>
        </div>

        {/* Main Content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '20px',
            marginTop: '80px',
          }}
        >
          {/* Habit Cards */}
          <div
            style={{
              width: '320px',
              padding: '20px',
              backgroundColor: '#1e293b',
              borderRadius: '12px',
              border: '1px solid #334155',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <span style={{ fontSize: '20px' }}>💧</span>
              <span style={{ fontSize: '16px', fontWeight: 'bold' }}>Drink Water</span>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                <div
                  key={day}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '6px',
                    backgroundColor: day <= 4 ? '#3b82f6' : '#374151',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                  }}
                >
                  {day <= 4 ? '✓' : ''}
                </div>
              ))}
            </div>
            <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '8px' }}>
              4 day streak • 57% consistency
            </div>
          </div>

          <div
            style={{
              width: '320px',
              padding: '20px',
              backgroundColor: '#1e293b',
              borderRadius: '12px',
              border: '1px solid #334155',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <span style={{ fontSize: '20px' }}>📚</span>
              <span style={{ fontSize: '16px', fontWeight: 'bold' }}>Read Books</span>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                <div
                  key={day}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '6px',
                    backgroundColor: day <= 2 ? '#3b82f6' : '#374151',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                  }}
                >
                  {day <= 2 ? '✓' : ''}
                </div>
              ))}
            </div>
            <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '8px' }}>
              2 day streak • 43% consistency
            </div>
          </div>

          <div
            style={{
              width: '320px',
              padding: '20px',
              backgroundColor: '#1e293b',
              borderRadius: '12px',
              border: '1px solid #334155',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <span style={{ fontSize: '20px' }}>🧘</span>
              <span style={{ fontSize: '16px', fontWeight: 'bold' }}>Meditate</span>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                <div
                  key={day}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '6px',
                    backgroundColor: day <= 6 ? '#3b82f6' : '#374151',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                  }}
                >
                  {day <= 6 ? '✓' : ''}
                </div>
              ))}
            </div>
            <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '8px' }}>
              6 day streak • 86% consistency
            </div>
          </div>
        </div>

        {/* Bottom Navigation */}
        <div
          style={{
            position: 'absolute',
            bottom: '20px',
            left: '20px',
            right: '20px',
            height: '60px',
            backgroundColor: '#1e293b',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-around',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
            <div style={{ fontSize: '20px' }}>🏠</div>
            <span style={{ fontSize: '10px' }}>Dashboard</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
            <div style={{ fontSize: '20px' }}>🎯</div>
            <span style={{ fontSize: '10px', color: '#3b82f6' }}>Habits</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
            <div style={{ fontSize: '20px' }}>⚙️</div>
            <span style={{ fontSize: '10px' }}>Setup</span>
          </div>
        </div>
      </div>
    ),
    {
      width: 390,
      height: 844,
    }
  )
}