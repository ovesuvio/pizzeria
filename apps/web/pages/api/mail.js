export const config = { api: { bodyParser: { sizeLimit: '1mb' } } };

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Metodo non consentito' });
  const { to, from, subject, text, html } = req.body || {};
  if (!to || !subject || (!text && !html)) return res.status(400).json({ error: 'Parametri email mancanti' });
  const key = process.env.RESEND_API_KEY;
  if (!key) return res.status(501).json({ error: 'Provider email non configurato' });
  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: from || 'no-reply@ovesuvio.com', to, subject, text, html }),
    });
    if (!r.ok) {
      const err = await r.text().catch(() => '');
      return res.status(502).json({ error: 'Invio email fallito', detail: err });
    }
    const data = await r.json().catch(() => ({}));
    return res.json({ ok: true, id: data?.id });
  } catch (_) {
    return res.status(500).json({ error: 'Errore invio email' });
  }
}