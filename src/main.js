import './style.css'
import { supabase } from './supabase.js'

const TIPOS = {
  accion: 'Acción',
  cedear: 'CEDEAR',
  bono: 'Bono',
  fci: 'FCI',
  cripto: 'Cripto',
  efectivo: 'Efectivo',
  otro: 'Otro',
}
const MONEDAS = ['ARS', 'USD', 'USDT', 'EUR', 'otra']

const app = document.getElementById('app')
let activos = []
let editandoId = null

const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])

const num = (n, max = 8) => new Intl.NumberFormat('es-AR', { maximumFractionDigits: max }).format(n)
const dinero = (n) => new Intl.NumberFormat('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)
const fecha = (iso) => (iso ? iso.split('-').reverse().join('/') : '')

// ---------- App ----------
// Sin login por ahora: la app corre solo en esta compu. Antes de publicarla hay que
// agregar acceso con passkey / Face ID y volver a cerrar las políticas de la tabla.

function cargarApp() {
  app.innerHTML = `
    <header class="top">
      <h1>Mis activos</h1>
    </header>
    <section class="summary" id="resumen"></section>
    <section class="card" id="form-card"></section>
    <section class="card">
      <h2>Portfolio</h2>
      <div class="table-wrap" id="tabla"></div>
    </section>`
  renderForm()
  return recargar()
}

cargarApp()


async function recargar() {
  const { data, error } = await supabase
    .from('activos')
    .select('*')
    .order('creado_en', { ascending: false })
  if (error) {
    document.getElementById('tabla').innerHTML =
      `<p class="msg error">No se pudieron cargar los activos: ${esc(error.message)}</p>`
    return
  }
  activos = data
  renderResumen()
  renderTabla()
}

function renderResumen() {
  const porMoneda = {}
  for (const a of activos) {
    const m = (porMoneda[a.moneda] ??= { invertido: 0, conPrecio: 0, total: 0 })
    m.total++
    if (a.precio_compra != null) {
      m.invertido += Number(a.cantidad) * Number(a.precio_compra)
      m.conPrecio++
    }
  }
  const tarjetas = Object.entries(porMoneda).map(
    ([moneda, m]) => `
      <div class="card">
        <div class="label">Invertido en ${esc(moneda)}</div>
        <div class="value">${dinero(m.invertido)}</div>
        <div class="sub">${m.conPrecio} de ${m.total} activos con precio de compra</div>
      </div>`,
  )
  document.getElementById('resumen').innerHTML =
    tarjetas.join('') +
    `<div class="card"><div class="label">Cantidad de activos</div><div class="value">${activos.length}</div>
     <div class="sub">Monedas distintas no se suman entre sí</div></div>`
}

function renderTabla() {
  const cont = document.getElementById('tabla')
  if (!activos.length) {
    cont.innerHTML = '<p class="empty">Todavía no cargaste ningún activo.</p>'
    return
  }
  cont.innerHTML = `
    <table>
      <thead><tr>
        <th>Ticker</th><th>Tipo</th><th class="num">Cantidad</th><th>Moneda</th>
        <th class="num">Precio compra</th><th>Fecha</th><th>Broker</th><th>Notas</th><th></th>
      </tr></thead>
      <tbody>
        ${activos
          .map(
            (a) => `
          <tr>
            <td><strong>${esc(a.ticker)}</strong></td>
            <td>${esc(TIPOS[a.tipo] ?? a.tipo)}</td>
            <td class="num">${num(a.cantidad)}</td>
            <td>${esc(a.moneda)}</td>
            <td class="num">${a.precio_compra != null ? dinero(a.precio_compra) : '—'}</td>
            <td>${esc(fecha(a.fecha_compra)) || '—'}</td>
            <td>${esc(a.broker) || '—'}</td>
            <td class="notes">${esc(a.notas)}</td>
            <td class="row-actions">
              <button class="link" data-editar="${esc(a.id)}">Editar</button>
              <button class="link danger" data-borrar="${esc(a.id)}">Borrar</button>
            </td>
          </tr>`,
          )
          .join('')}
      </tbody>
    </table>`

  cont.querySelectorAll('[data-editar]').forEach((b) =>
    b.addEventListener('click', () => {
      editandoId = b.dataset.editar
      renderForm()
      document.getElementById('form-card').scrollIntoView({ behavior: 'smooth' })
    }),
  )
  cont.querySelectorAll('[data-borrar]').forEach((b) =>
    b.addEventListener('click', async () => {
      const a = activos.find((x) => x.id === b.dataset.borrar)
      if (!confirm(`¿Borrar ${a.ticker}? Esto no se puede deshacer.`)) return
      const { error } = await supabase.from('activos').delete().eq('id', a.id)
      if (error) return alert('No se pudo borrar: ' + error.message)
      if (editandoId === a.id) editandoId = null
      renderForm()
      await recargar()
    }),
  )
}

function renderForm() {
  const a = activos.find((x) => x.id === editandoId) ?? {}
  const card = document.getElementById('form-card')
  card.innerHTML = `
    <h2>${editandoId ? 'Editar activo' : 'Agregar activo'}</h2>
    <form class="grid" id="activo-form">
      <label>Ticker o nombre
        <input name="ticker" required maxlength="40" value="${esc(a.ticker)}" placeholder="AAPL, GGAL, BTC…" /></label>
      <label>Tipo
        <select name="tipo" required>
          ${Object.entries(TIPOS).map(([v, t]) => `<option value="${v}" ${a.tipo === v ? 'selected' : ''}>${t}</option>`).join('')}
        </select></label>
      <label>Cantidad
        <input name="cantidad" type="number" step="any" min="0" required value="${esc(a.cantidad)}" /></label>
      <label>Moneda
        <select name="moneda" required>
          ${MONEDAS.map((m) => `<option ${a.moneda === m ? 'selected' : ''}>${m}</option>`).join('')}
        </select></label>
      <label>Precio de compra (por unidad, opcional)
        <input name="precio_compra" type="number" step="any" min="0" value="${esc(a.precio_compra)}" /></label>
      <label>Fecha de compra (opcional)
        <input name="fecha_compra" type="date" value="${esc(a.fecha_compra)}" /></label>
      <label>Broker / plataforma (opcional)
        <input name="broker" maxlength="60" value="${esc(a.broker)}" placeholder="IOL, Balanz, Binance…" /></label>
      <label class="full">Notas (opcional)
        <textarea name="notas" maxlength="500">${esc(a.notas)}</textarea></label>
      <div class="full actions">
        <button class="primary" type="submit">${editandoId ? 'Guardar cambios' : 'Agregar'}</button>
        ${editandoId ? '<button type="button" id="cancelar">Cancelar</button>' : ''}
      </div>
    </form>
    <p class="msg" id="form-msg"></p>`

  document.getElementById('cancelar')?.addEventListener('click', () => {
    editandoId = null
    renderForm()
  })

  document.getElementById('activo-form').addEventListener('submit', async (e) => {
    e.preventDefault()
    const d = new FormData(e.target)
    const texto = (k) => d.get(k).trim() || null
    const registro = {
      ticker: d.get('ticker').trim(),
      tipo: d.get('tipo'),
      cantidad: Number(d.get('cantidad')),
      moneda: d.get('moneda'),
      precio_compra: d.get('precio_compra') === '' ? null : Number(d.get('precio_compra')),
      fecha_compra: d.get('fecha_compra') || null,
      broker: texto('broker'),
      notas: texto('notas'),
    }
    const q = editandoId
      ? supabase.from('activos').update(registro).eq('id', editandoId)
      : supabase.from('activos').insert(registro)
    const { error } = await q
    const msg = document.getElementById('form-msg')
    if (error) {
      msg.className = 'msg error'
      msg.textContent = 'No se pudo guardar: ' + error.message
      return
    }
    editandoId = null
    renderForm()
    const ok = document.getElementById('form-msg')
    ok.className = 'msg ok'
    ok.textContent = 'Guardado.'
    await recargar()
  })
}
