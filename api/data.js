// api/data.js — серверный прокси к публичному API Аспро
// Использует ASPRO_API_KEY из переменных окружения Vercel
// Публичный API: https://2cec.aspro.cloud/api/v1/module/fin/...

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.ASPRO_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'ASPRO_API_KEY not set' });

  const { domain, entity } = req.body || {};
  if (!domain || !entity) return res.status(400).json({ error: 'Missing domain or entity' });

  // Белый список разрешённых сущностей
  const ALLOWED = ['transaction', 'bank_account', 'categories'];
  if (!ALLOWED.includes(entity)) return res.status(403).json({ error: 'Entity not allowed' });

  try {
    // Загружаем все записи постранично
    const allItems = [];
    let page = 1;
    const perPage = 100;

    while (true) {
      const url = `https://${domain}/api/v1/module/fin/${entity}/list`
        + `?api_key=${apiKey}&count=${perPage}&page=${page}`;

      const r = await fetch(url);
      if (!r.ok) {
        const text = await r.text();
        console.error(`[DDS] API error ${r.status} for ${entity}:`, text.slice(0, 200));
        return res.status(r.status).json({ error: `API returned ${r.status}`, detail: text.slice(0, 200) });
      }

      const data = await r.json();
      const items = data?.response?.items || [];
      allItems.push(...items);

      const total = data?.response?.total || 0;
      if (allItems.length >= total || items.length === 0) break;
      page++;
      if (page > 50) break; // защита от бесконечного цикла
    }

    return res.status(200).json({ items: allItems });

  } catch (err) {
    console.error('[DDS proxy] error:', err.message);
    return res.status(500).json({ error: err.message });
  }
};
