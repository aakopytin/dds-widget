module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.ASPRO_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'ASPRO_API_KEY not set' });

  const { domain, entity } = req.body || {};
  if (!domain || !entity) return res.status(400).json({ error: 'Missing params' });

  const ALLOWED = ['transaction', 'bank_account', 'categories'];
  if (!ALLOWED.includes(entity)) return res.status(403).json({ error: 'Not allowed' });

  const base = `https://${domain}/api/v1/module/fin/${entity}/list?api_key=${encodeURIComponent(apiKey)}&count=50`;

  try {
    // Первый запрос — узнаём total
    const r0 = await fetch(base + '&page=1');
    if (!r0.ok) {
      const text = await r0.text();
      return res.status(r0.status).json({ error: `API ${r0.status}`, detail: text.slice(0,200) });
    }
    const d0 = await r0.json();
    const firstItems = d0?.response?.items || [];
    const total = d0?.response?.total || 0;
    const totalPages = Math.ceil(total / 50);

    console.log(`[DDS] ${entity}: total=${total}, pages=${totalPages}`);

    if (totalPages <= 1) {
      return res.status(200).json({ items: firstItems });
    }

    // Загружаем остальные страницы параллельно (батчами по 10)
    const allItems = [...firstItems];
    const remaining = [];
    for (let p = 2; p <= Math.min(totalPages, 60); p++) {
      remaining.push(p);
    }

    // Батчи по 10 параллельных запросов
    const BATCH = 10;
    for (let i = 0; i < remaining.length; i += BATCH) {
      const batch = remaining.slice(i, i + BATCH);
      const results = await Promise.all(batch.map(async (page) => {
        const r = await fetch(base + '&page=' + page);
        if (!r.ok) return [];
        const d = await r.json();
        return d?.response?.items || [];
      }));
      results.forEach(items => allItems.push(...items));
      console.log(`[DDS] ${entity}: loaded ${allItems.length}/${total}`);
    }

    return res.status(200).json({ items: allItems });

  } catch (err) {
    console.error('[DDS] error:', err.message);
    return res.status(500).json({ error: err.message });
  }
};
