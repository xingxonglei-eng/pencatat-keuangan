const { createClient } = require('@supabase/supabase-js');

const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

// Cek token login dari browser, kembalikan data user (atau null)
async function getUser(req) {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  if (!token) return null;
  const { data, error } = await db.auth.getUser(token);
  return error ? null : data.user;
}

module.exports = async (req, res) => {
  try {
    const user = await getUser(req);
    if (!user) return res.status(401).json({ error: 'Belum login' });

    if (req.method === 'GET') {
      const { data, error } = await db
        .from('transactions').select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .order('id', { ascending: false });
      if (error) throw error;
      return res.status(200).json(data);
    }

    if (req.method === 'POST') {
      const { title, amount, type, category, date } = req.body || {};
      if (!title || !(Number(amount) > 0) || !['income', 'expense'].includes(type)) {
        return res.status(400).json({ error: 'Data tidak valid' });
      }
      const { data, error } = await db.from('transactions')
        .insert({
          user_id: user.id,
          title: String(title).slice(0, 100),
          amount: Number(amount),
          type,
          category: category || 'Lainnya',
          date: date || new Date().toISOString().slice(0, 10),
        })
        .select().single();
      if (error) throw error;
      return res.status(201).json(data);
    }

    if (req.method === 'DELETE') {
      const id = Number(req.query.id);
      if (!id) return res.status(400).json({ error: 'ID wajib diisi' });
      const { error } = await db.from('transactions')
        .delete().eq('id', id).eq('user_id', user.id);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }

    res.setHeader('Allow', 'GET, POST, DELETE');
    return res.status(405).json({ error: 'Method tidak didukung' });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
