import { ImageResponse } from 'next/og';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'transparent',
          color: 'black',
          fontSize: 20,
          fontWeight: 'bold',
          fontFamily: 'sans-serif',
        }}
      >
        IX
      </div>
    ),
    {
      ...size,
    }
  );
}

