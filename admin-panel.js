/**
 * Classtory — Standalone Admin Panel
 * Run: node admin-panel.js
 * Open: http://localhost:9999
 *
 * This file is completely standalone. It does NOT affect the Next.js project.
 */

const http = require('http')
const fs = require('fs')
const path = require('path')

// Read .env.local
const envPath = path.join(__dirname, '.env.local')
const envLines = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8').split('\n') : []
function getEnv(key) {
  const line = envLines.find(l => l.startsWith(key + '='))
  return line ? line.split('=').slice(1).join('=').trim() : ''
}

const SUPABASE_URL = getEnv('NEXT_PUBLIC_SUPABASE_URL')
const ANON_KEY = getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY')

// Config file for service role key (stored locally, never committed)
const configPath = path.join(__dirname, 'admin-panel.config.json')
function loadConfig() {
  try { return JSON.parse(fs.readFileSync(configPath, 'utf8')) } catch { return {} }
}
function saveConfig(data) {
  fs.writeFileSync(configPath, JSON.stringify(data, null, 2))
}

const PORT = 9999

const HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Classtory Admin Panel</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0 }
  body { font-family: 'Segoe UI', system-ui, sans-serif; background: #F8F9FC; color: #0F172A; min-height: 100vh }
  .topbar { background: #1E1B4B; color: white; padding: 0 24px; height: 56px; display: flex; align-items: center; justify-content: space-between; }
  .topbar h1 { font-size: 16px; font-weight: 700; letter-spacing: -0.01em }
  .topbar span { font-size: 12px; color: #A5B4FC }
  .container { max-width: 1100px; margin: 0 auto; padding: 32px 24px }
  .setup-card { background: white; border: 1px solid #E2E8F0; border-radius: 14px; padding: 32px; max-width: 480px; margin: 80px auto; box-shadow: 0 4px 12px rgba(0,0,0,0.08) }
  .setup-card h2 { font-size: 20px; font-weight: 700; margin-bottom: 8px }
  .setup-card p { font-size: 13px; color: #64748B; margin-bottom: 24px; line-height: 1.6 }
  label { display: block; font-size: 13px; font-weight: 500; margin-bottom: 6px; color: #0F172A }
  input[type=text], input[type=password] { width: 100%; height: 40px; border: 1px solid #E2E8F0; border-radius: 8px; padding: 0 12px; font-size: 14px; outline: none; transition: border-color 150ms }
  input:focus { border-color: #4F46E5; box-shadow: 0 0 0 3px rgba(79,70,229,0.1) }
  .field { margin-bottom: 16px }
  .hint { font-size: 11px; color: #94A3B8; margin-top: 4px }
  .btn { height: 40px; padding: 0 20px; border-radius: 8px; border: none; cursor: pointer; font-size: 14px; font-weight: 600; transition: background 150ms }
  .btn-primary { background: #4F46E5; color: white }
  .btn-primary:hover { background: #3730A3 }
  .btn-danger { background: #EF4444; color: white; font-size: 13px; padding: 0 14px; height: 34px }
  .btn-danger:hover { background: #DC2626 }
  .btn-sm { height: 32px; padding: 0 12px; font-size: 12px; font-weight: 600; border-radius: 6px; border: none; cursor: pointer }
  .stat-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; margin-bottom: 32px }
  .stat { background: white; border: 1px solid #E2E8F0; border-radius: 14px; padding: 20px; }
  .stat .num { font-size: 28px; font-weight: 700; color: #0F172A; margin-bottom: 4px }
  .stat .lbl { font-size: 13px; color: #64748B }
  .card { background: white; border: 1px solid #E2E8F0; border-radius: 14px; overflow: hidden; margin-bottom: 24px }
  .card-header { padding: 16px 20px; border-bottom: 1px solid #F1F5F9; display: flex; align-items: center; justify-content: space-between }
  .card-header h3 { font-size: 15px; font-weight: 700 }
  table { width: 100%; border-collapse: collapse }
  th { background: #F8FAFC; font-size: 11px; font-weight: 600; color: #64748B; text-transform: uppercase; letter-spacing: 0.05em; padding: 10px 16px; text-align: left; border-bottom: 1px solid #E2E8F0 }
  td { padding: 12px 16px; font-size: 13px; border-bottom: 1px solid #F1F5F9 }
  tr:last-child td { border-bottom: none }
  tr:hover td { background: #F8FAFC }
  .badge { display: inline-flex; align-items: center; padding: 2px 10px; border-radius: 9999px; font-size: 11px; font-weight: 600 }
  .badge-teacher { background: #EEF2FF; color: #3730A3 }
  .badge-student { background: #D1FAE5; color: #065F46 }
  .badge-admin { background: #FEE2E2; color: #991B1B }
  select { height: 32px; border: 1px solid #E2E8F0; border-radius: 6px; padding: 0 8px; font-size: 12px; cursor: pointer; outline: none }
  select:focus { border-color: #4F46E5 }
  .toast { position: fixed; bottom: 24px; right: 24px; background: #1E1B4B; color: white; padding: 12px 20px; border-radius: 10px; font-size: 13px; font-weight: 500; opacity: 0; transition: opacity 300ms; pointer-events: none; z-index: 999 }
  .toast.show { opacity: 1 }
  .error-banner { background: #FEE2E2; border: 1px solid #FECACA; border-radius: 10px; padding: 12px 16px; font-size: 13px; color: #991B1B; margin-bottom: 16px }
  #loading { display: flex; align-items: center; justify-content: center; padding: 60px; color: #94A3B8; font-size: 14px }
</style>
</head>
<body>
<div class="topbar">
  <h1>⚙ Classtory Admin Panel</h1>
  <span id="topbar-info">Loading...</span>
</div>

<div class="container">
  <!-- Setup screen -->
  <div id="setup-screen" style="display:none">
    <div class="setup-card">
      <h2>Admin Setup</h2>
      <p>Enter your Supabase <strong>service role key</strong> to enable admin operations.<br>
      Find it at: <strong>Supabase Dashboard → Settings → API → service_role</strong></p>
      <div id="setup-error" style="display:none" class="error-banner"></div>
      <div class="field">
        <label>Service Role Key</label>
        <input type="password" id="service-key-input" placeholder="eyJhbGciOiJIUzI1NiIs..." />
        <div class="hint">This is stored locally in admin-panel.config.json — never committed to git.</div>
      </div>
      <button class="btn btn-primary" onclick="saveServiceKey()">Save & Continue</button>
    </div>
  </div>

  <!-- Main dashboard -->
  <div id="dashboard" style="display:none">
    <div style="margin-bottom:24px;display:flex;align-items:center;justify-content:space-between">
      <div>
        <h2 style="font-size:22px;font-weight:800;letter-spacing:-0.02em">Admin Dashboard</h2>
        <p style="font-size:13px;color:#64748B;margin-top:4px">Manage users, roles, and platform data</p>
      </div>
      <div style="display:flex;gap:8px">
        <button class="btn btn-sm" style="background:#F1F5F9;color:#0F172A;border:1px solid #E2E8F0" onclick="loadAll()">↻ Refresh</button>
        <button class="btn btn-sm btn-danger" onclick="clearKey()">Change Key</button>
      </div>
    </div>

    <!-- Stats -->
    <div class="stat-grid" id="stats">
      <div class="stat"><div class="num" id="stat-users">—</div><div class="lbl">Total Users</div></div>
      <div class="stat"><div class="num" id="stat-teachers">—</div><div class="lbl">Teachers</div></div>
      <div class="stat"><div class="num" id="stat-students">—</div><div class="lbl">Students</div></div>
      <div class="stat"><div class="num" id="stat-classrooms">—</div><div class="lbl">Classrooms</div></div>
      <div class="stat"><div class="num" id="stat-courses">—</div><div class="lbl">Courses</div></div>
    </div>

    <!-- Users table -->
    <div class="card">
      <div class="card-header">
        <h3>All Users</h3>
        <span id="user-count" style="font-size:12px;color:#94A3B8"></span>
      </div>
      <div id="users-loading"><div id="loading">Loading users...</div></div>
      <div id="users-table" style="display:none">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Joined</th>
              <th>Change Role</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody id="users-tbody"></tbody>
        </table>
      </div>
    </div>

    <!-- Classrooms table -->
    <div class="card">
      <div class="card-header">
        <h3>All Classrooms</h3>
        <span id="classroom-count" style="font-size:12px;color:#94A3B8"></span>
      </div>
      <div id="classrooms-loading"><div id="loading">Loading classrooms...</div></div>
      <div id="classrooms-table" style="display:none">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Subject</th>
              <th>Teacher</th>
              <th>Class Code</th>
              <th>Created</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody id="classrooms-tbody"></tbody>
        </table>
      </div>
    </div>
  </div>
</div>

<div class="toast" id="toast"></div>

<script>
const SUPABASE_URL = '${SUPABASE_URL}'

let serviceKey = null

function showToast(msg, color) {
  const t = document.getElementById('toast')
  t.textContent = msg
  t.style.background = color || '#1E1B4B'
  t.classList.add('show')
  setTimeout(() => t.classList.remove('show'), 3000)
}

async function supabase(path, opts = {}) {
  const res = await fetch(SUPABASE_URL + '/rest/v1/' + path, {
    headers: {
      apikey: serviceKey,
      Authorization: 'Bearer ' + serviceKey,
      'Content-Type': 'application/json',
      Prefer: opts.prefer || 'return=representation',
      ...opts.headers,
    },
    method: opts.method || 'GET',
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  })
  const text = await res.text()
  try { return { data: JSON.parse(text), ok: res.ok, status: res.status } }
  catch { return { data: text, ok: res.ok, status: res.status } }
}

async function saveServiceKey() {
  const val = document.getElementById('service-key-input').value.trim()
  if (!val) return
  const err = document.getElementById('setup-error')
  err.style.display = 'none'

  // Test the key
  const test = await fetch(SUPABASE_URL + '/rest/v1/profiles?limit=1', {
    headers: { apikey: val, Authorization: 'Bearer ' + val }
  })
  if (!test.ok) {
    err.textContent = 'Invalid service role key. Make sure you copied the full key from Supabase → Settings → API.'
    err.style.display = 'block'
    return
  }

  // Save via server
  await fetch('/save-key', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: val }) })
  serviceKey = val
  document.getElementById('setup-screen').style.display = 'none'
  document.getElementById('dashboard').style.display = 'block'
  loadAll()
}

function clearKey() {
  fetch('/clear-key', { method: 'POST' })
  serviceKey = null
  document.getElementById('dashboard').style.display = 'none'
  document.getElementById('setup-screen').style.display = 'block'
}

async function loadAll() {
  loadUsers()
  loadClassrooms()
  loadStats()
}

async function loadStats() {
  const [users, classrooms, courses] = await Promise.all([
    supabase('profiles?select=role'),
    supabase('classrooms?select=id'),
    supabase('courses?select=id'),
  ])
  const u = Array.isArray(users.data) ? users.data : []
  document.getElementById('stat-users').textContent = u.length
  document.getElementById('stat-teachers').textContent = u.filter(x => x.role === 'teacher').length
  document.getElementById('stat-students').textContent = u.filter(x => x.role === 'student').length
  document.getElementById('stat-classrooms').textContent = Array.isArray(classrooms.data) ? classrooms.data.length : 0
  document.getElementById('stat-courses').textContent = Array.isArray(courses.data) ? courses.data.length : 0
  document.getElementById('topbar-info').textContent = SUPABASE_URL.replace('https://', '').split('.')[0]
}

async function loadUsers() {
  document.getElementById('users-loading').style.display = 'block'
  document.getElementById('users-table').style.display = 'none'
  const { data } = await supabase('profiles?select=*&order=created_at.desc')
  const users = Array.isArray(data) ? data : []
  document.getElementById('user-count').textContent = users.length + ' users'

  const tbody = document.getElementById('users-tbody')
  tbody.innerHTML = users.map(u => \`
    <tr>
      <td style="font-weight:500">\${u.full_name || '—'}</td>
      <td style="color:#64748B">\${u.email}</td>
      <td><span class="badge badge-\${u.role}">\${u.role}</span></td>
      <td style="color:#94A3B8;font-size:12px">\${new Date(u.created_at).toLocaleDateString()}</td>
      <td>
        <select onchange="changeRole('\${u.id}', this.value)" style="min-width:100px">
          <option value="student" \${u.role==='student'?'selected':''}>student</option>
          <option value="teacher" \${u.role==='teacher'?'selected':''}>teacher</option>
          <option value="admin" \${u.role==='admin'?'selected':''}>admin</option>
        </select>
      </td>
      <td>
        <button class="btn btn-sm btn-danger" onclick="deleteUser('\${u.id}', '\${u.email.replace(/'/g,'&apos;')}')">Delete</button>
      </td>
    </tr>
  \`).join('')

  document.getElementById('users-loading').style.display = 'none'
  document.getElementById('users-table').style.display = 'block'
}

async function loadClassrooms() {
  document.getElementById('classrooms-loading').style.display = 'block'
  document.getElementById('classrooms-table').style.display = 'none'
  const { data } = await supabase('classrooms?select=*,teacher:profiles(full_name,email)&order=created_at.desc')
  const rooms = Array.isArray(data) ? data : []
  document.getElementById('classroom-count').textContent = rooms.length + ' classrooms'

  const tbody = document.getElementById('classrooms-tbody')
  tbody.innerHTML = rooms.map(c => \`
    <tr>
      <td style="font-weight:500">\${c.name}</td>
      <td style="color:#64748B">\${c.subject}</td>
      <td>\${c.teacher?.full_name || '—'}</td>
      <td><code style="background:#F1F5F9;padding:2px 8px;border-radius:4px;font-size:12px">\${c.class_code}</code></td>
      <td style="color:#94A3B8;font-size:12px">\${new Date(c.created_at).toLocaleDateString()}</td>
      <td>
        <button class="btn btn-sm btn-danger" onclick="deleteClassroom('\${c.id}', '\${c.name.replace(/'/g,'&apos;')}')">Delete</button>
      </td>
    </tr>
  \`).join('')

  document.getElementById('classrooms-loading').style.display = 'none'
  document.getElementById('classrooms-table').style.display = 'block'
}

async function changeRole(userId, newRole) {
  const { ok } = await supabase(\`profiles?id=eq.\${userId}\`, {
    method: 'PATCH',
    body: { role: newRole },
    prefer: 'return=minimal',
  })
  if (ok) {
    showToast('Role updated to ' + newRole, '#059669')
    loadStats()
    loadUsers()
  } else {
    showToast('Failed to update role', '#EF4444')
  }
}

async function deleteClassroom(id, name) {
  if (!confirm('Delete classroom "' + name + '"? This cannot be undone.')) return
  const { ok } = await supabase(\`classrooms?id=eq.\${id}\`, { method: 'DELETE', prefer: 'return=minimal' })
  if (ok) { showToast('Classroom deleted'); loadClassrooms(); loadStats() }
  else showToast('Failed to delete', '#EF4444')
}

async function deleteUser(id, email) {
  if (!confirm('Permanently delete user "' + email + '"?\\nThis removes them from auth and all their data. Cannot be undone.')) return
  // Delete from auth.users (cascades to profiles via FK)
  const res = await fetch(SUPABASE_URL + '/auth/v1/admin/users/' + id, {
    method: 'DELETE',
    headers: { apikey: serviceKey, Authorization: 'Bearer ' + serviceKey },
  })
  if (res.ok || res.status === 204) {
    showToast('User deleted', '#059669')
    loadUsers()
    loadStats()
  } else {
    const err = await res.text()
    showToast('Failed to delete user: ' + err, '#EF4444')
  }
}

// Init
async function init() {
  const res = await fetch('/get-key')
  const json = await res.json()
  if (json.key) {
    serviceKey = json.key
    document.getElementById('dashboard').style.display = 'block'
    loadAll()
  } else {
    document.getElementById('setup-screen').style.display = 'block'
  }
}
init()
</script>
</body>
</html>`

const server = http.createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
    res.end(HTML)
  } else if (req.method === 'POST' && req.url === '/save-key') {
    let body = ''
    req.on('data', d => body += d)
    req.on('end', () => {
      try {
        const { key } = JSON.parse(body)
        const cfg = loadConfig()
        cfg.serviceKey = key
        saveConfig(cfg)
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ ok: true }))
      } catch {
        res.writeHead(400)
        res.end()
      }
    })
  } else if (req.method === 'POST' && req.url === '/clear-key') {
    const cfg = loadConfig()
    delete cfg.serviceKey
    saveConfig(cfg)
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ ok: true }))
  } else if (req.method === 'GET' && req.url === '/get-key') {
    const cfg = loadConfig()
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ key: cfg.serviceKey || null }))
  } else {
    res.writeHead(404)
    res.end()
  }
})

server.listen(PORT, () => {
  console.log('\n╔══════════════════════════════════════╗')
  console.log('║   Classtory Admin Panel is running   ║')
  console.log('╠══════════════════════════════════════╣')
  console.log(`║   Open: http://localhost:${PORT}        ║`)
  console.log('╚══════════════════════════════════════╝\n')
  // Auto-open browser
  const { exec } = require('child_process')
  exec(`start http://localhost:${PORT}`)
})
