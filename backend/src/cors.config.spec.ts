import { getAllowedOrigins, isOriginAllowed } from './cors.config';

describe('cors config', () => {
  it('uses local frontend origins by default', () => {
    expect(getAllowedOrigins()).toEqual([
      'http://localhost:5173',
      'http://localhost',
    ]);
  });

  it('normalizes configured frontend origins', () => {
    expect(
      getAllowedOrigins(
        ' https://url-health-checker-frontend.vercel.app/ , https://preview.vercel.app/path ',
      ),
    ).toEqual([
      'http://localhost:5173',
      'http://localhost',
      'https://url-health-checker-frontend.vercel.app',
      'https://preview.vercel.app',
    ]);
  });

  it('allows empty origins and configured origins', () => {
    const allowedOrigins = getAllowedOrigins(
      'https://url-health-checker-frontend.vercel.app/',
    );

    expect(isOriginAllowed(undefined, allowedOrigins)).toBe(true);
    expect(
      isOriginAllowed(
        'https://url-health-checker-frontend.vercel.app',
        allowedOrigins,
      ),
    ).toBe(true);
    expect(isOriginAllowed('https://example.com', allowedOrigins)).toBe(false);
  });
});
