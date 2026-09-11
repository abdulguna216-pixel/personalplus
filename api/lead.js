const requiredFields = ['type', 'city', 'role', 'amount', 'shift', 'date', 'name', 'phone'];

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const data = req.body || {};
  if (requiredFields.some((field) => !String(data[field] || '').trim()) || !data.consent) {
    return res.status(400).json({ error: 'Заполните все обязательные поля.' });
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    console.error('Telegram environment variables are not configured.');
    return res.status(500).json({ error: 'Приём заявок временно недоступен.' });
  }

  const message = [
    '🔔 Новая заявка с сайта «Персонал+»',
    '',
    `Имя: ${data.name}`,
    `Телефон: ${data.phone}`,
    `Тип объекта: ${data.type}`,
    `Город: ${data.city}`,
    `Профессия: ${data.role}`,
    `Количество: ${data.amount}`,
    `Смена: ${data.shift}`,
    `Дата начала: ${data.date}`,
  ].join('\n');

  try {
    const telegramResponse = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: message }),
    });

    if (!telegramResponse.ok) {
      console.error('Telegram API error:', await telegramResponse.text());
      return res.status(502).json({ error: 'Не удалось отправить заявку.' });
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Telegram request failed:', error);
    return res.status(502).json({ error: 'Не удалось отправить заявку.' });
  }
};
