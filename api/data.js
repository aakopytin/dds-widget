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

  try {
    const allItems = [];
    let page = 1;

    while (true) {
      // Транзакции — от новых к старым
      const sortParam = entity === 'transaction' ? '&sort=date&order=desc' : '';
      const url = `https://${domain}/api/v1/module/fin/${entity}/list`
        + `?api_key=${encodeURIComponent(apiKey)}&count=50&page=${page}${sortParam}`;

      const r = await fetch(url);
      if (!r.ok) {
        const text = await r.text();
        return res.status(r.status).json({ error: `API ${r.status}`, detail: text.slice(0,200) });
      }

      const data = await r.json();
      const items = data?.response?.items || [];
      const total = data?.response?.total || 0;
      allItems.push(...items);

      console.log(`[DDS] ${entity} p${page}: ${allItems.length}/${total}`);

      // Для транзакций — останавливаемся когда последняя дата раньше текущего года
      if (entity === 'transaction' && items.length > 0) {
        const lastDate = items[items.length - 1].date || '';
        const thisYear = new Date().getFullYear() + '-01-01';
        if (lastDate < thisYear) {
          console.log(`[DDS] stopping at date ${lastDate}`);
          break;
        }
      }

      if (allItems.length >= total || items.length === 0 || page > 60) break;
      page++;
    }

    return res.status(200).json({ items: allItems });
  } catch (err) {
    console.error('[DDS] error:', err.message);
    return res.status(500).json({ error: err.message });
  }
};
