import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const size = {
    width: 512,
    height: 512,
};

export const contentType = 'image/png';

export async function GET() {
    return new ImageResponse(
        (
            <div
                style={{
                    fontSize: 320,
                    background: 'linear-gradient(to bottom right, #6366f1, #8b5cf6)',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    borderRadius: '20%',
                }}
            >
                🎵
            </div>
        ),
        {
            ...size,
        }
    );
}
