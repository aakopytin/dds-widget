// api/data.js — серверный прокси к публичному API Аспро

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.ASPRO_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'ASPRO_API_KEY not set' });

  const { domain, entity, dateFrom, dateTo } = req.body || {};
  if (!domain || !entity) return res.status(400).json({ error: 'Missing domain or entity' });

  const ALLOWED = ['transaction', 'bank_account', 'categories'];
  if (!ALLOWED.includes(entity)) return res.status(403).json({ error: 'Entity not allowed' });

  try {
    const allItems = [];
    let page = 1;
    const perPage = 500; // максимум за запрос

    while (true) {
      // Для транзакций фильтруем по дате чтобы не тащить всю историю
      let url = `https://${domain}/api/v1/module/fin/${entity}/list`
        + `?api_key=${apiKey}&count=${perPage}&page=${page}`;

      // Добавляем фильтр по дате если передан
      if (entity === 'transaction') {
        // Берём текущий год чтобы захватить fixed_balance_date транзакции
        const year = new Date().getFullYear();
        const from = dateFrom || `${year}-01-01`;
        const to   = dateTo   || `${year}-12-31`;
        url += `&filter[date][from]=${from}&filter[date][to]=${to}`;
      }

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
      console.log(`[DDS] ${entity} page ${page}: ${items.length} items, total ${total}`);

      if (allItems.length >= total || items.length === 0) break;
      page++;
      if (page > 20) break; // защита
    }

    return res.status(200).json({ items: allItems });

  } catch (err) {
    console.error('[DDS proxy] error:', err.message);
    return res.status(500).json({ error: err.message });
  }
};
