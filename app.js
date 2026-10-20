const API = '/api/transactions';
const $ = (id) => document.getElementById(id);
const rupiah = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);
const form = $('form');
form.date.value = new Date().toISOString().slice(0, 10);

async function api(url = API, options) {
  const res = await fetch(url, options);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Terjadi kesalahan');
  return data;
}

function render(items) {
  const income = items.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
  const expense = items.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
  $('balance').textContent = rupiah(income - expense);
  $('income').textContent = rupiah(income);
  $('expense').textContent = rupiah(expense);
  $('empty').hidden = items.length > 0;

  const list = $('list');
  list.replaceChildren();
  for (const t of items) {
    const li = document.createElement('li');
    const left = document.createElement('div');
    const title = document.createElement('div');
    title.className = 't'; title.textContent = t.title;
    const meta = document.createElement('div');
    meta.className = 'meta'; meta.textContent = `${t.category}, ${t.date}`;
    left.append(title, meta);

    const amt = document.createElement('div');
    amt.className = 'amt ' + (t.type === 'income' ? 'in' : 'out');
    amt.textContent = (t.type === 'income' ? '+' : '-') + rupiah(t.amount);

    const del = document.createElement('button');
    del.className = 'del'; del.textContent = 'Hapus';
    del.onclick = async () => {
      if (!confirm('Hapus transaksi ini?')) return;
      try { await api(`${API}?id=${t.id}`, { method: 'DELETE' }); load(); }
      catch (e) { $('error').textContent = e.message; }
    };
    li.append(left, amt, del);
    list.append(li);
  }
}

async function load() {
  try { render(await api()); }
  catch (e) { $('error').textContent = 'Gagal memuat data: ' + e.message; }
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  $('error').textContent = '';
  const btn = form.querySelector('button[type=submit]');
  btn.disabled = true;
  const f = new FormData(form);
  try {
    await api(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: f.get('title'), amount: Number(f.get('amount')),
        type: f.get('type'), category: f.get('category'), date: f.get('date'),
      }),
    });
    form.title.value = ''; form.amount.value = '';
    load();
  } catch (err) { $('error').textContent = err.message; }
  btn.disabled = false;
});

load();
