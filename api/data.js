// api/data.js — серверный прокси к API Аспро
// Браузер в iframe не может напрямую обратиться к 2cec.aspro.cloud (CORS).
// Этот endpoint делает запрос server-side и возвращает данные браузеру.

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { domain, token, endpoint } = req.body || {};

  if (!domain || !token || !endpoint) {
    return res.status(400).json({ error: 'Missing domain, token or endpoint' });
  }

  // Белый список разрешённых endpoint-ов
  const ALLOWED = [
    '/_module/fin/rest/transaction/list/',
    '/_module/fin/rest/payin/list/',
  ];
  if (!ALLOWED.includes(endpoint)) {
    return res.status(403).json({ error: 'Endpoint not allowed' });
  }

  try {
    const url = 'https://' + domain + endpoint;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Bearer ' + token,
      },
      body: 'sort=date&order=asc&offset=0&limit=2500',
    });

    const data = await response.json();
    return res.status(200).json(data);

  } catch (err) {
    console.error('[DDS proxy] error:', err.message);
    return res.status(500).json({ error: err.message });
  }
};
