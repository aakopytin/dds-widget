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

  const base = `https://${domain}/api/v1/module/fin/${entity}/list`
    + `?api_key=${encodeURIComponent(apiKey)}&count=50`;

  try {
    // Шаг 1: узнаём total
    const r0 = await fetch(base + '&page=1');
    if (!r0.ok) return res.status(r0.status).json({ error: `API ${r0.status}` });
    const d0 = await r0.json();
    const total = d0?.response?.total || 0;
    const totalPages = Math.ceil(total / 50);

    console.log(`[DDS] ${entity}: total=${total}, pages=${totalPages}`);

    // Шаг 2: загружаем все страницы параллельно
    const pageNums = [];
    for (let p = 1; p <= Math.min(totalPages, 60); p++) pageNums.push(p);

    // Батчи по 8 параллельных запросов
    const BATCH = 8;
    const pageResults = new Array(pageNums.length);

    for (let i = 0; i < pageNums.length; i += BATCH) {
      const batch = pageNums.slice(i, i + BATCH);
      const responses = await Promise.all(batch.map(async (page) => {
        const r = await fetch(base + '&page=' + page);
        if (!r.ok) return { page, items: [] };
        const d = await r.json();
        return { page, items: d?.response?.items || [] };
      }));
      responses.forEach(res => { pageResults[res.page - 1] = res.items; });
      console.log(`[DDS] ${entity}: batch done, pages ${batch[0]}-${batch[batch.length-1]}`);
    }

    // Собираем в правильном порядке
    const allItems = [];
    pageResults.forEach(items => { if (items) allItems.push(...items); });

    console.log(`[DDS] ${entity}: collected ${allItems.length}/${total}`);
    return res.status(200).json({ items: allItems });

  } catch (err) {
    console.error('[DDS] error:', err.message);
    return res.status(500).json({ error: err.message });
  }
};
