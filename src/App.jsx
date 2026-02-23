import { useState, useEffect, useRef } from 'react'
import { ref, onValue, set, get } from 'firebase/database'
import { db } from './firebase.js'
import * as XLSX from 'xlsx'

const APP_URL = "https://meal-qr-app.vercel.app"

const MEAL_SLOTS = [
  { id: 'breakfast', label: 'Petit Déjeuner', icon: '☕', start: 8,  end: 10, color: '#F59E0B' },
  { id: 'lunch',     label: 'Déjeuner',       icon: '🍽️', start: 12, end: 14, color: '#10B981' },
  { id: 'coffee',    label: 'Pause Café',      icon: '🫖', start: 18, end: 20, color: '#8B5CF6' },
]
const EVENT_DAYS = ['Jour 1', 'Jour 2', 'Jour 3']

function generateId() {
  return Math.random().toString(36).slice(2, 10).toUpperCase()
}
function getScanKey(participantId, day, slotId) {
  return `${participantId}_day${day}_${slotId}`
}
function getQRImage(qrCode, size = 300) {
  const data = encodeURIComponent(`${APP_URL}/scan?code=${qrCode}`)
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${data}&margin=10`
}

const inputStyle = {
  background: '#0F172A', color: '#E2E8F0',
  border: '1px solid #334155', borderRadius: 10,
  padding: '10px 14px', fontSize: 14, fontFamily: 'inherit',
  outline: 'none', width: '100%', boxSizing: 'border-box',
}

function Card({ children, style }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.09)',
      borderRadius: 16, padding: 20, ...style,
    }}>{children}</div>
  )
}

function Btn({ onClick, children, color = '#6366F1', small, disabled, outline, full }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      background: outline ? 'transparent' : (disabled ? '#1E293B' : color),
      border: `2px solid ${disabled ? '#334155' : color}`,
      color: outline ? color : '#fff',
      borderRadius: 10, padding: small ? '6px 14px' : '11px 22px',
      fontSize: small ? 13 : 15, fontWeight: 700,
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.6 : 1, transition: 'all .15s',
      fontFamily: 'inherit', width: full ? '100%' : undefined,
    }}>{children}</button>
  )
}

function Badge({ color, children }) {
  return (
    <span style={{
      display: 'inline-block', padding: '3px 10px', borderRadius: 20,
      background: color + '22', color, fontSize: 12, fontWeight: 700,
    }}>{children}</span>
  )
}

// ─── PAGE AUTO-SCAN : charge Firebase directement, sans dépendre du state parent ──
function AutoScanPage({ code, simDay, simSlot }) {
  const [result, setResult] = useState(null)
  const [status, setStatus] = useState('Connexion à Firebase...')

  useEffect(() => {
    if (!code) {
      setResult({ ok: false, color: '#EF4444', msg: '❌ Erreur', detail: 'Code QR manquant.' })
      return
    }

    async function validate() {
      try {
        setStatus('Chargement des participants...')
        const snapP  = await get(ref(db, 'participants'))
        const snapSc = await get(ref(db, 'scans'))

        const participants = snapP.exists() ? Object.values(snapP.val()) : []
        const scans        = snapSc.exists() ? snapSc.val() : {}

        setStatus('Vérification du code...')
        const p = participants.find(x => x.qrCode === code)

        if (!p) {
          setResult({ ok: false, color: '#EF4444', msg: '❌ QR invalide', detail: 'Code non reconnu.' })
          return
        }

        const slot = MEAL_SLOTS.find(s => s.id === simSlot)
        const key  = getScanKey(p.id, simDay, simSlot)

        if (scans[key]) {
          setResult({
            ok: false, color: '#EF4444',
            msg: '⛔ REFUSÉ',
            detail: p.name,
            sub: `${slot.icon} ${slot.label} — Jour ${simDay + 1} déjà servi`,
          })
        } else {
          await set(ref(db, `scans/${key}`), {
            participant: { name: p.name, id: p.id },
            day: simDay, slot: simSlot,
            time: new Date().toISOString()
          })
          setResult({
            ok: true, color: '#10B981',
            msg: '✅ VALIDÉ',
            detail: p.name,
            sub: `${slot.icon} ${slot.label} — Jour ${simDay + 1}`,
          })
        }
      } catch (err) {
        setResult({ ok: false, color: '#EF4444', msg: '⚠️ Erreur Firebase', detail: 'Vérifiez votre connexion internet.' })
      }
    }

    validate()
  }, [])

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: result ? (result.ok ? '#052e16' : '#1c0a0a') : '#0B1120',
      padding: 24, fontFamily: "'Sora', sans-serif",
      transition: 'background .5s',
    }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;700;900&display=swap');
        @keyframes pop { from{opacity:0;transform:scale(.5)} to{opacity:1;transform:scale(1)} }
        @keyframes spin { to{transform:rotate(360deg)} }`}
      </style>

      {!result ? (
        <div style={{ textAlign: 'center', color: '#94A3B8' }}>
          <div style={{
            width: 60, height: 60, border: '4px solid #334155',
            borderTopColor: '#6366F1', borderRadius: '50%',
            animation: 'spin 1s linear infinite', margin: '0 auto 24px'
          }} />
          <div style={{ fontSize: 20, fontWeight: 700, color: '#E2E8F0', marginBottom: 8 }}>
            Vérification en cours...
          </div>
          <div style={{ fontSize: 14, color: '#64748B' }}>{status}</div>
        </div>
      ) : (
        <div style={{ textAlign: 'center', maxWidth: 420, width: '100%' }}>
          <div style={{ fontSize: 90, animation: 'pop .4s cubic-bezier(.34,1.56,.64,1)', marginBottom: 16 }}>
            {result.ok ? '✅' : result.msg.includes('REFUSÉ') ? '⛔' : '❌'}
          </div>
          <div style={{ fontSize: 38, fontWeight: 900, color: result.color, marginBottom: 10 }}>
            {result.msg}
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#F1F5F9', marginBottom: 8 }}>
            {result.detail}
          </div>
          {result.sub && (
            <div style={{ fontSize: 18, color: '#94A3B8', marginBottom: 28 }}>
              {result.sub}
            </div>
          )}
          <div style={{
            background: result.color + '22', border: `2px solid ${result.color}`,
            borderRadius: 16, padding: '14px 20px', color: result.color,
            fontSize: 15, fontWeight: 700, marginBottom: 24,
          }}>
            {result.ok ? '✓ Repas enregistré avec succès' : '✗ ' + (result.sub || result.detail)}
          </div>
          <button onClick={() => window.location.href = APP_URL} style={{
            background: 'rgba(255,255,255,0.06)', border: '1px solid #334155',
            color: '#94A3B8', borderRadius: 12, padding: '12px 28px',
            fontSize: 15, cursor: 'pointer', fontFamily: 'inherit',
          }}>← Retour à l'application</button>
        </div>
      )}
    </div>
  )
}

// ─── SCANNER MANUEL ───────────────────────────────────────────────────────────
function ScannerView({ participants, scans, onScan, simDay, simSlot, setSimDay, setSimSlot }) {
  const [input, setInput]   = useState('')
  const [result, setResult] = useState(null)
  const inputRef = useRef(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  function extractCode(raw) {
    try { const u = new URL(raw); const c = u.searchParams.get('code'); if (c) return c } catch {}
    return raw.trim()
  }

  function processCode(raw) {
    const code = extractCode(raw)
    if (!code) return
    const p = participants.find(x => x.qrCode === code)
    if (!p) {
      setResult({ ok: false, color: '#EF4444', msg: '❌ QR invalide', detail: `Code "${code}" inconnu.` })
      setInput(''); setTimeout(() => setResult(null), 4000); return
    }
    const slot = MEAL_SLOTS.find(s => s.id === simSlot)
    const key  = getScanKey(p.id, simDay, simSlot)
    if (scans[key]) {
      setResult({ ok: false, color: '#EF4444', msg: '⛔ REFUSÉ', detail: p.name, sub: `${slot.icon} ${slot.label} — Jour ${simDay + 1} déjà servi` })
    } else {
      onScan(key, { participant: { name: p.name, id: p.id }, day: simDay, slot: simSlot, time: new Date().toISOString() })
      setResult({ ok: true, color: '#10B981', msg: '✅ VALIDÉ', detail: p.name, sub: `${slot.icon} ${slot.label} — Jour ${simDay + 1}` })
    }
    setInput(''); inputRef.current?.focus(); setTimeout(() => setResult(null), 5000)
  }

  return (
    <div style={{ maxWidth: 520, margin: '0 auto' }}>
      <Card style={{ marginBottom: 16, borderColor: 'rgba(99,102,241,0.3)' }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#6366F1', marginBottom: 10 }}>📱 Comment scanner ?</div>
        <div style={{ fontSize: 13, color: '#94A3B8', lineHeight: 1.8 }}>
          <div>• <b style={{ color: '#E2E8F0' }}>iPhone / Android</b> — Ouvrez l'appareil photo, pointez le QR → l'app s'ouvre et valide</div>
          <div>• <b style={{ color: '#E2E8F0' }}>Lecteur QR USB</b> — Branchez-le, le code apparaît automatiquement ci-dessous</div>
          <div>• <b style={{ color: '#E2E8F0' }}>Saisie manuelle</b> — Tapez le code dans le champ ci-dessous</div>
        </div>
      </Card>

      <Card style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 13, color: '#64748B', marginBottom: 12, fontWeight: 700 }}>⚙️ Repas en cours</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          {MEAL_SLOTS.map(s => (
            <button key={s.id} onClick={() => setSimSlot(s.id)} style={{
              flex: 1, minWidth: 80, padding: '10px 8px', borderRadius: 12, cursor: 'pointer',
              background: s.id === simSlot ? s.color + '33' : 'rgba(255,255,255,0.04)',
              border: `2px solid ${s.id === simSlot ? s.color : 'rgba(255,255,255,0.08)'}`,
              color: s.id === simSlot ? s.color : '#64748B',
              fontFamily: 'inherit', fontWeight: 700, textAlign: 'center',
            }}>
              <div style={{ fontSize: 20 }}>{s.icon}</div>
              <div style={{ fontSize: 11, marginTop: 4 }}>{s.label}</div>
              <div style={{ fontSize: 10, opacity: 0.7 }}>{s.start}h–{s.end}h</div>
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {EVENT_DAYS.map((d, i) => (
            <button key={i} onClick={() => setSimDay(i)} style={{
              flex: 1, padding: '8px', borderRadius: 10, cursor: 'pointer',
              background: i === simDay ? '#6366F133' : 'rgba(255,255,255,0.04)',
              border: `2px solid ${i === simDay ? '#6366F1' : 'rgba(255,255,255,0.08)'}`,
              color: i === simDay ? '#6366F1' : '#64748B',
              fontFamily: 'inherit', fontWeight: 700, fontSize: 13,
            }}>{d}</button>
          ))}
        </div>
      </Card>

      <Card style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 13, color: '#64748B', marginBottom: 10, fontWeight: 700 }}>⌨️ Lecteur USB ou saisie manuelle</div>
        <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && processCode(input)}
          placeholder="Le lecteur USB écrit ici automatiquement..."
          style={{ ...inputStyle, fontFamily: 'monospace', fontSize: 15, marginBottom: 10 }}
          autoComplete='off' />
        <Btn onClick={() => processCode(input)} disabled={!input.trim()} full>Valider ↵</Btn>
      </Card>

      {result && (
        <div style={{
          borderRadius: 16, padding: '28px 24px', textAlign: 'center',
          background: result.color + '18', border: `2px solid ${result.color}`,
          animation: 'pop .3s cubic-bezier(.34,1.56,.64,1)',
        }}>
          <div style={{ fontSize: 48, fontWeight: 900, color: result.color }}>{result.msg}</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#E2E8F0', marginTop: 8 }}>{result.detail}</div>
          <div style={{ fontSize: 16, color: '#94A3B8', marginTop: 6 }}>{result.sub}</div>
        </div>
      )}
    </div>
  )
}

// ─── PARTICIPANTS ─────────────────────────────────────────────────────────────
function ParticipantsView({ participants, scans, onAdd, onDelete, onImport }) {
  const [name, setName]         = useState('')
  const [email, setEmail]       = useState('')
  const [search, setSearch]     = useState('')
  const [selected, setSelected] = useState(null)
  const [printing, setPrinting] = useState(false)
  const fileRef = useRef(null)

  function handleAdd() {
    if (!name.trim()) return
    onAdd({ id: generateId(), name: name.trim(), email: email.trim(), qrCode: generateId() })
    setName(''); setEmail('')
  }

  function handleImport(e) {
    const file = e.target.files[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const wb = XLSX.read(ev.target.result, { type: 'binary' })
      const ws = wb.Sheets[wb.SheetNames[0]]
      const rows = XLSX.utils.sheet_to_json(ws, { header: 1 })
      const imported = []
      for (let i = 1; i < rows.length; i++) {
        const [n, em] = rows[i]; if (!n) continue
        imported.push({ id: generateId(), name: String(n).trim(), email: em ? String(em).trim() : '', qrCode: generateId() })
      }
      if (imported.length) onImport(imported)
      else alert('Aucun participant trouvé.\nFormat : colonne A = Nom, colonne B = Email')
    }
    reader.readAsBinaryString(file); e.target.value = ''
  }

  function printAllQR() {
    setPrinting(true)
    const win = window.open('', '_blank')
    win.document.write(`<!DOCTYPE html><html><head>
      <title>QR Codes Repas</title>
      <style>
        body{font-family:'Segoe UI',sans-serif;background:#fff;margin:0;padding:20px}
        h1{color:#1e1b4b;border-bottom:3px solid #6366f1;padding-bottom:12px;font-size:20px}
        .grid{display:flex;flex-wrap:wrap;gap:14px}
        .card{border:2px solid #e2e8f0;border-radius:16px;padding:16px;text-align:center;width:185px;page-break-inside:avoid;break-inside:avoid}
        .card img{border-radius:8px;border:3px solid #1e1b4b}
        .name{font-size:13px;font-weight:700;color:#1e293b;margin-top:8px}
        .email{font-size:11px;color:#64748b;margin-top:2px}
        .code{font-size:9px;color:#94a3b8;margin-top:4px;font-family:monospace}
        .tag{font-size:10px;color:#6366f1;font-weight:700;margin-bottom:6px;background:#eef2ff;border-radius:20px;padding:2px 8px;display:inline-block}
        @media print{@page{margin:1cm}}
      </style></head><body>
      <h1>🎪 QR Codes — Repas Cérémonie (${participants.length} participants)</h1>
      <div class="grid">
        ${participants.map(p => `
          <div class="card">
            <div class="tag">3 JOURS · 3 REPAS/JOUR</div>
            <img src="${getQRImage(p.qrCode, 155)}" width="155" height="155" />
            <div class="name">${p.name}</div>
            ${p.email ? `<div class="email">${p.email}</div>` : ''}
            <div class="code">${p.qrCode}</div>
          </div>`).join('')}
      </div>
      <script>
        window.onload=()=>{
          const imgs=document.querySelectorAll('img');let n=0;
          const done=()=>{n++;if(n===imgs.length)window.print()};
          imgs.forEach(i=>{if(i.complete)done();else{i.onload=done;i.onerror=done}});
          if(!imgs.length)window.print()
        }
      </script></body></html>`)
    win.document.close(); setPrinting(false)
  }

  function getStatus(p) {
    let done = 0
    EVENT_DAYS.forEach((_, di) => MEAL_SLOTS.forEach(s => { if (scans[getScanKey(p.id, di, s.id)]) done++ }))
    return { done, total: EVENT_DAYS.length * MEAL_SLOTS.length }
  }

  const filtered = participants.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.email || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={{ maxWidth: 780, margin: '0 auto' }}>
      <Card style={{ marginBottom: 16 }}>
        <h3 style={{ margin: '0 0 14px', fontSize: 16 }}>Ajouter un participant</h3>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Nom complet *"
            style={{ ...inputStyle, flex: 1, minWidth: 150 }} onKeyDown={e => e.key === 'Enter' && handleAdd()} />
          <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email (optionnel)"
            style={{ ...inputStyle, flex: 1, minWidth: 150 }} onKeyDown={e => e.key === 'Enter' && handleAdd()} />
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Btn onClick={handleAdd} disabled={!name.trim()}>+ Ajouter</Btn>
          <Btn onClick={() => fileRef.current?.click()} color='#0EA5E9' outline>📊 Importer Excel</Btn>
          <input ref={fileRef} type='file' accept='.xlsx,.xls' style={{ display: 'none' }} onChange={handleImport} />
          {participants.length > 0 && (
            <Btn onClick={printAllQR} color='#8B5CF6' outline disabled={printing}>🖨️ Imprimer tous les QR</Btn>
          )}
        </div>
        <div style={{ marginTop: 10, fontSize: 12, color: '#475569' }}>
          📄 Excel : colonne A = Nom, colonne B = Email (ligne 1 = en-têtes)
        </div>
      </Card>

      <input value={search} onChange={e => setSearch(e.target.value)}
        placeholder='🔍 Rechercher...' style={{ ...inputStyle, marginBottom: 12, fontSize: 15 }} />
      <div style={{ color: '#64748B', fontSize: 13, marginBottom: 12 }}>{filtered.length} / {participants.length} participant(s)</div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.map(p => {
          const st = getStatus(p); const open = selected?.id === p.id
          return (
            <Card key={p.id} style={{ cursor: 'pointer', border: open ? '1px solid #6366F1' : undefined }}
              onClick={() => setSelected(open ? null : p)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>{p.name}</div>
                  {p.email && <div style={{ fontSize: 13, color: '#64748B' }}>{p.email}</div>}
                  <div style={{ fontSize: 11, color: '#475569', marginTop: 3, fontFamily: 'monospace' }}>{p.qrCode}</div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <Badge color={st.done === st.total ? '#10B981' : st.done > 0 ? '#F59E0B' : '#64748B'}>{st.done}/{st.total} repas</Badge>
                  <Btn small color='#EF4444' outline onClick={e => { e.stopPropagation(); onDelete(p.id) }}>✕</Btn>
                </div>
              </div>
              {open && (
                <div style={{ marginTop: 20, display: 'flex', flexWrap: 'wrap', gap: 24 }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 13, color: '#64748B', marginBottom: 8 }}>📱 Scannable avec l'appareil photo</div>
                    <img src={getQRImage(p.qrCode, 160)} alt={`QR ${p.name}`}
                      style={{ borderRadius: 12, border: '4px solid #1E293B', width: 160, display: 'block' }} />
                    <a href={getQRImage(p.qrCode, 300)} download={`qr-${p.name}.png`} target='_blank'
                      style={{ display: 'block', marginTop: 8 }} onClick={e => e.stopPropagation()}>
                      <Btn small color='#6366F1'>⬇ Télécharger</Btn>
                    </a>
                  </div>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ fontSize: 13, color: '#64748B', marginBottom: 8 }}>Suivi des repas</div>
                    <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 13 }}>
                      <thead><tr>
                        <th style={{ color: '#64748B', fontWeight: 400, padding: '4px 6px', textAlign: 'left' }}></th>
                        {MEAL_SLOTS.map(s => <th key={s.id} style={{ color: '#94A3B8', fontWeight: 400, padding: '4px 6px', textAlign: 'center' }}>{s.icon}<br /><span style={{ fontSize: 10 }}>{s.label}</span></th>)}
                      </tr></thead>
                      <tbody>{EVENT_DAYS.map((d, di) => (
                        <tr key={di}>
                          <td style={{ color: '#94A3B8', fontSize: 12, padding: '5px 6px', whiteSpace: 'nowrap' }}>{d}</td>
                          {MEAL_SLOTS.map(s => {
                            const done = scans[getScanKey(p.id, di, s.id)]
                            return <td key={s.id} style={{ textAlign: 'center', padding: '3px 4px' }}>
                              <div style={{ borderRadius: 8, padding: '5px 0', background: done ? s.color + '33' : 'rgba(255,255,255,0.04)', border: `1px solid ${done ? s.color : 'transparent'}`, color: done ? s.color : '#475569', fontWeight: 700 }}>{done ? '✓' : '–'}</div>
                            </td>
                          })}
                        </tr>
                      ))}</tbody>
                    </table>
                  </div>
                </div>
              )}
            </Card>
          )
        })}
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', color: '#475569', padding: 60 }}>
            {participants.length === 0 ? '👋 Ajoutez des participants ou importez un fichier Excel.' : 'Aucun résultat.'}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function DashboardView({ participants, scans }) {
  const totalSlots   = participants.length * EVENT_DAYS.length * MEAL_SLOTS.length
  const totalScanned = Object.keys(scans).length
  const pct          = totalSlots ? Math.round(totalScanned / totalSlots * 100) : 0
  const slotStats = MEAL_SLOTS.map(s => {
    let count = 0
    participants.forEach(p => EVENT_DAYS.forEach((_, di) => { if (scans[getScanKey(p.id, di, s.id)]) count++ }))
    return { ...s, count, max: participants.length * EVENT_DAYS.length }
  })
  const recent = Object.values(scans).sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 12)

  return (
    <div style={{ maxWidth: 780, margin: '0 auto' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Participants', value: participants.length, color: '#6366F1' },
          { label: 'Scans effectués', value: totalScanned, color: '#10B981' },
          { label: 'Restants', value: totalSlots - totalScanned, color: '#F59E0B' },
          { label: 'Présence', value: pct + '%', color: '#8B5CF6' },
        ].map(s => (
          <Card key={s.label} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 30, fontWeight: 900, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>{s.label}</div>
          </Card>
        ))}
      </div>
      <Card style={{ marginBottom: 16 }}>
        <h3 style={{ margin: '0 0 16px' }}>Repas servis par créneau</h3>
        {slotStats.map(s => (
          <div key={s.id} style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 14 }}>
              <span>{s.icon} {s.label}</span><span style={{ color: '#94A3B8' }}>{s.count}/{s.max}</span>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 20, height: 10, overflow: 'hidden' }}>
              <div style={{ width: s.max ? `${s.count/s.max*100}%` : '0%', height: '100%', background: s.color, borderRadius: 20, transition: 'width .6s' }} />
            </div>
          </div>
        ))}
      </Card>
      <Card>
        <h3 style={{ margin: '0 0 16px' }}>Derniers scans 🔴</h3>
        {recent.length === 0
          ? <div style={{ color: '#475569', textAlign: 'center', padding: 20 }}>Aucun scan.</div>
          : recent.map((s, i) => {
              const slot = MEAL_SLOTS.find(m => m.id === s.slot)
              return (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: i < recent.length-1 ? '1px solid rgba(255,255,255,0.06)' : 'none', flexWrap: 'wrap', gap: 6 }}>
                  <div>
                    <span style={{ fontWeight: 700 }}>{s.participant?.name}</span>
                    <span style={{ color: '#64748B', fontSize: 13 }}> — Jour {s.day + 1}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <Badge color={slot?.color}>{slot?.icon} {slot?.label}</Badge>
                    <span style={{ fontSize: 12, color: '#475569' }}>{s.time ? new Date(s.time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                  </div>
                </div>
              )
            })
        }
      </Card>
    </div>
  )
}

// ─── APP ROOT ─────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab]       = useState('scanner')
  const [participants, setParticipants] = useState([])
  const [scans, setScans]   = useState({})
  const [simDay, setSimDay] = useState(0)
  const [simSlot, setSimSlot] = useState(MEAL_SLOTS[0].id)
  const [status, setStatus] = useState('Connexion...')

  const urlParams  = new URLSearchParams(window.location.search)
  const scanCode   = urlParams.get('code')
  const isAutoScan = !!scanCode

  useEffect(() => {
    const unsubP = onValue(ref(db, 'participants'), snap => {
      setParticipants(snap.exists() ? Object.values(snap.val()) : [])
      setStatus('En ligne ✅')
    }, () => setStatus('Hors ligne ⚠️'))
    const unsubSc = onValue(ref(db, 'scans'), snap => { setScans(snap.exists() ? snap.val() : {}) })
    return () => { unsubP(); unsubSc() }
  }, [])

  async function addParticipant(p)    { await set(ref(db, `participants/${p.id}`), p) }
  async function deleteParticipant(id){ await set(ref(db, `participants/${id}`), null) }
  async function importParticipants(list) { await Promise.all(list.map(p => set(ref(db, `participants/${p.id}`), p))) }
  async function handleScan(key, data){ await set(ref(db, `scans/${key}`), data) }
  async function resetScans() { if (!confirm('Réinitialiser TOUS les scans ?')) return; await set(ref(db, 'scans'), null) }
  async function resetAll()   { if (!confirm('Supprimer tout ?')) return; await set(ref(db, 'participants'), null); await set(ref(db, 'scans'), null) }

  // Page auto-scan quand iPhone scanne le QR
  if (isAutoScan) {
    return (
      <>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;700;900&display=swap')`}</style>
        <AutoScanPage code={scanCode} simDay={simDay} simSlot={simSlot} />
      </>
    )
  }

  const tabs = [
    { id: 'scanner',      label: '⌨️ Scanner' },
    { id: 'participants', label: '👥 Participants' },
    { id: 'dashboard',   label: '📊 Dashboard' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#0B1120', color: '#E2E8F0', fontFamily: "'Sora','Segoe UI',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;700;900&display=swap');
        @keyframes pop { from{opacity:0;transform:scale(.92)} to{opacity:1;transform:scale(1)} }
        * { box-sizing: border-box; }
        input:focus { border-color: #6366F1 !important; outline: none; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-thumb { background: #334155; border-radius: 3px; }
      `}</style>

      <div style={{ background: 'linear-gradient(135deg,#1E1B4B 0%,#0F172A 100%)', borderBottom: '1px solid rgba(99,102,241,.25)', padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 900 }}><span style={{ color: '#6366F1' }}>QR</span> Repas Cérémonie</div>
          <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>{status} · {participants.length} participants · {Object.keys(scans).length} scans</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Btn small color='#EF4444' outline onClick={resetScans}>🔄 Reset scans</Btn>
          <Btn small color='#7F1D1D' outline onClick={resetAll}>🗑️ Tout effacer</Btn>
        </div>
      </div>

      <div style={{ display: 'flex', background: '#0F172A', borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '0 12px', overflowX: 'auto' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ background: 'none', border: 'none', whiteSpace: 'nowrap', color: tab === t.id ? '#6366F1' : '#64748B', padding: '14px 16px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', borderBottom: tab === t.id ? '3px solid #6366F1' : '3px solid transparent' }}>{t.label}</button>
        ))}
      </div>

      {/* Bandeau repas actif */}
      <div style={{ background: '#0F172A', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '10px 16px', display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ fontSize: 12, color: '#475569' }}>Repas actif :</span>
        {MEAL_SLOTS.map(s => (
          <button key={s.id} onClick={() => setSimSlot(s.id)} style={{ background: s.id === simSlot ? s.color+'33' : 'transparent', border: `1px solid ${s.id === simSlot ? s.color : '#334155'}`, color: s.id === simSlot ? s.color : '#64748B', borderRadius: 20, padding: '3px 12px', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700 }}>{s.icon} {s.label}</button>
        ))}
        <span style={{ color: '#334155' }}>|</span>
        {EVENT_DAYS.map((d, i) => (
          <button key={i} onClick={() => setSimDay(i)} style={{ background: i === simDay ? '#6366F133' : 'transparent', border: `1px solid ${i === simDay ? '#6366F1' : '#334155'}`, color: i === simDay ? '#6366F1' : '#64748B', borderRadius: 20, padding: '3px 12px', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700 }}>{d}</button>
        ))}
      </div>

      <div style={{ padding: '20px 12px', maxWidth: 840, margin: '0 auto' }}>
        {tab === 'scanner'      && <ScannerView participants={participants} scans={scans} onScan={handleScan} simDay={simDay} simSlot={simSlot} setSimDay={setSimDay} setSimSlot={setSimSlot} />}
        {tab === 'participants' && <ParticipantsView participants={participants} scans={scans} onAdd={addParticipant} onDelete={deleteParticipant} onImport={importParticipants} />}
        {tab === 'dashboard'    && <DashboardView participants={participants} scans={scans} />}
      </div>
    </div>
  )
}
