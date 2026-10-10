import { getSettings } from '@/lib/settings';

export const dynamic = 'force-dynamic';

// Serve /ads.txt automaticamente a partir do ID guardado no painel admin
export async function GET() {
  const s = await getSettings();
  const pub = (s.adsense_client || '').replace('ca-', '');
  return new Response(pub ? `google.com, ${pub}, DIRECT, f08c47fec0942fa0\n` : '', {
    headers: { 'content-type': 'text/plain' },
  });
}
