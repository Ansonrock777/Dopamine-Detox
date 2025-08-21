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
          backgroundColor: '#0f172a',
          backgroundImage: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          color: 'white',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {/* Sidebar */}
        <div
          style={{
            width: '280px',
            backgroundColor: '#1e293b',
            borderRight: '1px solid #334155',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
          }}
        >
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
              }}
            >
              🧠
            </div>
            <span style={{ fontSize: '20px', fontWeight: 'bold' }}>Dopamine Detox</span>
          </div>

          {/* Navigation */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div
              style={{
                padding: '12px 16px',
                borderRadius: '8px',
                backgroundColor: '#3b82f6',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                fontSize: '14px',
                fontWeight: '500',
              }}
            >
              <span>🏠</span>
              Dashboard
            </div>
            <div
              style={{
                padding: '12px 16px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                fontSize: '14px',
                color: '#94a3b8',
              }}
            >
              <span>🎯</span>
              Habit Tracker
            </div>
            <div
              style={{
                padding: '12px 16px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                fontSize: '14px',
                color: '#94a3b8',
              }}
            >
              <span>🤔</span>
              Reflection Wall
            </div>
            <div
              style={{
                padding: '12px 16px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                fontSize: '14px',
                color: '#94a3b8',
              }}
            >
              <span>⚙️</span>
              Setup Instructions
            </div>
          </div>

          {/* User Info */}
          <div
            style={{
              marginTop: 'auto',
              padding: '16px',
              backgroundColor: '#0f172a',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: '#3b82f6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
              }}
            >
              👤
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: '500' }}>John Doe</div>
              <div style={{ fontSize: '12px', color: '#94a3b8' }}>john@example.com</div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div style={{ flex: 1, padding: '32px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {/* Header */}
          <div>
            <h1 style={{ fontSize: '32px', fontWeight: 'bold', margin: 0, marginBottom: '8px' }}>
              Website Blocking
            </h1>
            <p style={{ fontSize: '16px', color: '#94a3b8', margin: 0 }}>
              Manage your blocked websites and digital wellness settings
            </p>
          </div>

          {/* Stats Cards */}
          <div style={{ display: 'flex', gap: '24px' }}>
            <div
              style={{
                flex: 1,
                padding: '24px',
                backgroundColor: '#1e293b',
                borderRadius: '12px',
                border: '1px solid #334155',
              }}
            >
              <div style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '8px' }}>
                Blocked Sites
              </div>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#3b82f6' }}>
                247
              </div>
            </div>
            <div
              style={{
                flex: 1,
                padding: '24px',
                backgroundColor: '#1e293b',
                borderRadius: '12px',
                border: '1px solid #334155',
              }}
            >
              <div style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '8px' }}>
                Focus Time
              </div>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#10b981' }}>
                4.2h
              </div>
            </div>
            <div
              style={{
                flex: 1,
                padding: '24px',
                backgroundColor: '#1e293b',
                borderRadius: '12px',
                border: '1px solid #334155',
              }}
            >
              <div style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '8px' }}>
                Streak
              </div>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#f59e0b' }}>
                12
              </div>
            </div>
          </div>

          {/* Categories */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              backgroundColor: '#1e293b',
              padding: '24px',
              borderRadius: '12px',
              border: '1px solid #334155',
            }}
          >
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>
              Blocked Categories
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '20px' }}>📱</span>
                  <span style={{ fontSize: '16px' }}>Social Media</span>
                </div>
                <div
                  style={{
                    width: '48px',
                    height: '24px',
                    borderRadius: '12px',
                    backgroundColor: '#3b82f6',
                    position: 'relative',
                  }}
                >
                  <div
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      backgroundColor: 'white',
                      position: 'absolute',
                      right: '2px',
                      top: '2px',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '20px' }}>🛒</span>
                  <span style={{ fontSize: '16px' }}>Shopping</span>
                </div>
                <div
                  style={{
                    width: '48px',
                    height: '24px',
                    borderRadius: '12px',
                    backgroundColor: '#374151',
                    position: 'relative',
                  }}
                >
                  <div
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      backgroundColor: 'white',
                      position: 'absolute',
                      left: '2px',
                      top: '2px',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '20px' }}>📰</span>
                  <span style={{ fontSize: '16px' }}>News</span>
                </div>
                <div
                  style={{
                    width: '48px',
                    height: '24px',
                    borderRadius: '12px',
                    backgroundColor: '#3b82f6',
                    position: 'relative',
                  }}
                >
                  <div
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      backgroundColor: 'white',
                      position: 'absolute',
                      right: '2px',
                      top: '2px',
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width: 1280,
      height: 720,
    }
  )
}