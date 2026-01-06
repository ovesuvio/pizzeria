export default async function handler(_req, res) {
  try {
    const base = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000';
    const r = await fetch(`${base}/orders/status`);
    const data = r.ok ? await r.json() : { disabled: false, message: '', disabled_until: 0 };
    res.json(data);
  } catch (_) {
    res.json({ disabled: false, message: '', disabled_until: 0 });
  }
}