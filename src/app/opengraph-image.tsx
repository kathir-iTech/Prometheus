import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'VivaMind — Socratic Argumentation Engine';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'flex-start',
          background: '#0B0C0E',
          padding: '80px',
        }}
      >
        <div style={{ fontSize: 96, fontWeight: 800, color: '#FFB077', display: 'flex' }}>
          VivaMind
        </div>
        <div
          style={{
            fontSize: 32,
            color: '#ffffffaa',
            marginTop: 24,
            maxWidth: 900,
            display: 'flex',
          }}
        >
          Won&apos;t fix your argument or give you the answer — finds the weakest point and makes
          you defend it.
        </div>
      </div>
    ),
    { ...size }
  );
}
