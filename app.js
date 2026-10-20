// Isi dua nilai ini dari Supabase (Project Settings > API). Keduanya aman dibuat publik.
const SUPABASE_URL = 'https://iyqzrimkwozozwguhwif.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml5cXpyaW1rd296b3p3Z3Vod2lmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI0OTQzNzQsImV4cCI6MjEwODA3MDM3NH0.arRMid6L1lqrkP41-wcpgF_WoExqYtBbwUpESVikF2U';

const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const API = '/api/transactions';
const $ = (id) => document.getElementById(id);
const rupiah = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);
const form = $('form');
form.date.value = new Date().toISOString().slice(0, 10);
let accessToken = null;

async function api(url = API, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: { ...(options.headers || {}), Authorization: 'Bearer ' + accessToken },
  });
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

// ---------- Login ----------
$('authForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const f = new FormData(e.target);
  const { error } = await sb.auth.signInWithPassword({ email: f.get('email'), password: f.get('password') });
  $('authError').textContent = error ? 'Email atau password salah.' : '';
});

$('signup').addEventListener('click', async () => {
  const formEl = $('authForm');
  if (!formEl.reportValidity()) return;
  const f = new FormData(formEl);
  const { data, error } = await sb.auth.signUp({ email: f.get('email'), password: f.get('password') });
  if (error) $('authError').textContent = error.message;
  else if (!data.session) $('authError').textContent = 'Akun dibuat. Cek email untuk konfirmasi, lalu masuk.';
});

$('logout').addEventListener('click', () => sb.auth.signOut());

sb.auth.onAuthStateChange((_event, session) => {
  accessToken = session ? session.access_token : null;
  $('auth').hidden = !!session;
  $('app').hidden = !session;
  if (session) {
    $('userEmail').textContent = session.user.email;
    load();
  } else {
    $('list').replaceChildren();
  }
});
