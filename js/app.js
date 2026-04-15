// ===== CONFIG =====
const API = 'php/api.php';
let currentUser = null;
let allPatients = [];
let currentFilter = '';
let currentStatusFilter = '';
let modalPatientId = null;

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  updateClock();
  setInterval(updateClock, 1000);
  setGreeting();
  checkAuth();
  document.getElementById('loginPass').addEventListener('keypress', e => { if (e.key === 'Enter') doLogin(); });
  document.getElementById('loginUser').addEventListener('keypress', e => { if (e.key === 'Enter') doLogin(); });
});

function updateClock() {
  const now = new Date();
  const el = document.getElementById('topbarTime');
  if (el) el.textContent = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function setGreeting() {
  const h = new Date().getHours();
  const greetEl = document.getElementById('greeting-time');
  if (greetEl) greetEl.textContent = h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening';
}

// ===== AUTH =====
async function checkAuth() {
  try {
    const res = await fetch(`${API}?action=check_auth`);
    const data = await res.json();
    if (data.authenticated) {
      currentUser = data.user;
      showApp();
    } else {
      showLogin();
    }
  } catch {
    showLogin();
  }
}

async function doLogin() {
  const username = document.getElementById('loginUser').value.trim();
  const password = document.getElementById('loginPass').value;
  const errEl = document.getElementById('loginError');
  const btn = document.querySelector('.btn-login');

  if (!username || !password) {
    errEl.textContent = 'Please enter your username and password.';
    errEl.classList.remove('hidden');
    return;
  }

  btn.innerHTML = '<div class="spinner" style="width:20px;height:20px;border-width:2px;border-color:rgba(255,255,255,0.3);border-top-color:white"></div> Signing in…';
  btn.disabled = true;
  errEl.classList.add('hidden');

  try {
    const res = await fetch(`${API}?action=login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();

    if (data.success) {
      currentUser = data.user;
      showApp();
      showToast('Welcome back, ' + data.user.full_name.split(' ')[0] + '!', 'success');
    } else {
      errEl.textContent = data.error || 'Invalid credentials. Please try again.';
      errEl.classList.remove('hidden');
    }
  } catch {
    errEl.textContent = 'Connection error. Make sure the server is running.';
    errEl.classList.remove('hidden');
  }

  btn.innerHTML = '<span>Sign In</span><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>';
  btn.disabled = false;
}

async function doLogout() {
  await fetch(`${API}?action=logout`, { method: 'POST' });
  currentUser = null;
  showLogin();
  showToast('Logged out successfully', 'info');
}

function showLogin() {
  document.getElementById('loginScreen').classList.remove('hidden');
  document.getElementById('mainApp').classList.add('hidden');
}

function showApp() {
  document.getElementById('loginScreen').classList.add('hidden');
  document.getElementById('mainApp').classList.remove('hidden');

  // Update sidebar user info
  const name = currentUser.full_name;
  const initials = name.split(' ').slice(0, 2).map(n => n[0]).join('');
  document.getElementById('sidebarAvatar').textContent = initials;
  document.getElementById('sidebarName').textContent = name;
  document.getElementById('sidebarRole').textContent = currentUser.role;
  document.getElementById('greeting-name').textContent = name.split(' ')[0];

  // Profile page
  document.getElementById('profileAvatar').textContent = initials;
  document.getElementById('profileName').textContent = name;
  document.getElementById('profileRole').textContent = currentUser.role;
  document.getElementById('profileAccess').textContent = currentUser.role === 'admin' ? 'Full Access' : 'Limited Access';
  document.getElementById('profileLoginTime').textContent = new Date().toLocaleTimeString();

  showPage('dashboard');
}

function togglePassword() {
  const input = document.getElementById('loginPass');
  input.type = input.type === 'password' ? 'text' : 'password';
}

// ===== NAVIGATION =====
function showPage(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  const target = document.getElementById('page-' + page);
  if (target) target.classList.add('active');

  const navItem = document.querySelector(`[data-page="${page}"]`);
  if (navItem) navItem.classList.add('active');

  const titles = {
    'dashboard': 'Dashboard',
    'records-list': 'Patient Records',
    'add-record': 'Add Patient',
    'reports': 'Reports & Analytics',
    'history': 'Activity History',
    'profile': 'My Profile'
  };
  document.getElementById('topbarTitle').textContent = titles[page] || page;

  // Load page data
  if (page === 'dashboard') { loadStats(); loadRecentPatients(); }
  else if (page === 'records-list') loadPatients();
  else if (page === 'reports') { loadStats(); loadAllRecords(); }
  else if (page === 'history') loadHistory();
  else if (page === 'add-record') { resetPatientForm(); document.getElementById('addFormTitle').textContent = 'Register New Patient'; }

  // Close sidebar on mobile
  if (window.innerWidth <= 768) document.getElementById('sidebar').classList.remove('open');
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
}

// ===== LOAD STATS =====
async function loadStats() {
  try {
    const res = await fetch(`${API}?action=get_stats`);
    const data = await res.json();

    // Stat cards
    animateNum('s-total', data.total_patients);
    animateNum('s-active', data.active_patients);
    animateNum('s-records', data.total_records);
    animateNum('s-critical', data.critical_patients);
    document.getElementById('s-month').textContent = data.new_this_month;

    document.querySelectorAll('.stat-card').forEach(c => c.classList.remove('loading'));

    // Status bar chart
    const statuses = data.status_dist || [];
    const total = statuses.reduce((s, r) => s + parseInt(r.count), 0);
    const colors = { Active: '#10B981', Critical: '#EF4444', Stable: '#0EA5E9', Discharged: '#5A6882', 'Under Observation': '#F59E0B' };

    const chartEl = document.getElementById('statusChart');
    if (chartEl) {
      chartEl.innerHTML = statuses.map(s => `
        <div class="status-bar-item">
          <div class="status-bar-label"><span>${s.status}</span><span>${s.count} / ${total}</span></div>
          <div class="status-bar-track">
            <div class="status-bar-fill" style="width:${(s.count/total*100).toFixed(1)}%;background:${colors[s.status] || '#0EA5E9'}"></div>
          </div>
        </div>
      `).join('');
    }

    // Blood type chart
    const btEl = document.getElementById('bloodTypeChart');
    if (btEl && data.blood_types?.length) {
      const maxBt = Math.max(...data.blood_types.map(b => b.count));
      btEl.innerHTML = data.blood_types.map(b => `
        <div class="bar-item">
          <div class="bar-label"><span>${b.blood_type}</span><span>${b.count} patients</span></div>
          <div class="bar-track"><div class="bar-fill" style="width:${(b.count/maxBt*100).toFixed(1)}%"></div></div>
        </div>
      `).join('');
    }

    // Gender donut
    const gEl = document.getElementById('genderChart');
    if (gEl && data.gender_dist?.length) {
      const gTotal = data.gender_dist.reduce((s, g) => s + parseInt(g.count), 0);
      const gColors = ['#0EA5E9', '#EC4899', '#6366F1'];
      gEl.innerHTML = data.gender_dist.map((g, i) => `
        <div class="donut-item">
          <div class="donut-dot" style="background:${gColors[i]}"></div>
          <span class="donut-label">${g.gender}</span>
          <div class="donut-bar"><div class="donut-bar-fill" style="width:${(g.count/gTotal*100).toFixed(0)}%;background:${gColors[i]}"></div></div>
          <span class="donut-val">${g.count}</span>
        </div>
      `).join('');
    }

    // Department chart
    const dEl = document.getElementById('deptChart');
    if (dEl && data.departments?.length) {
      const maxD = Math.max(...data.departments.map(d => d.count));
      dEl.innerHTML = data.departments.map(d => `
        <div class="bar-item">
          <div class="bar-label"><span>${d.department}</span><span>${d.count} visits</span></div>
          <div class="bar-track"><div class="bar-fill" style="width:${(d.count/maxD*100).toFixed(1)}%"></div></div>
        </div>
      `).join('');
    }

  } catch (e) {
    console.error('Stats error:', e);
  }
}

function animateNum(id, target) {
  const el = document.getElementById(id);
  if (!el) return;
  let current = 0;
  const step = Math.ceil(target / 20);
  const timer = setInterval(() => {
    current = Math.min(current + step, target);
    el.textContent = current;
    if (current >= target) clearInterval(timer);
  }, 40);
}

// ===== LOAD PATIENTS =====
async function loadPatients(search = '', status = '') {
  const loader = document.getElementById('tableLoader');
  const body = document.getElementById('patientsBody');
  const empty = document.getElementById('tableEmpty');
  const countEl = document.getElementById('recordsCount');

  if (loader) loader.style.display = 'flex';
  if (empty) empty.classList.add('hidden');
  if (body) body.innerHTML = '';

  try {
    const params = new URLSearchParams({ action: 'get_patients' });
    if (search) params.append('search', search);
    if (status) params.append('status', status);
    const res = await fetch(`${API}?${params}`);
    const data = await res.json();
    allPatients = data.patients || [];

    if (countEl) countEl.textContent = `${data.total} patient${data.total !== 1 ? 's' : ''} registered`;
    if (loader) loader.style.display = 'none';

    if (!allPatients.length) {
      if (empty) empty.classList.remove('hidden');
      return;
    }

    if (body) {
      body.innerHTML = allPatients.map(p => {
        const name = `${p.first_name} ${p.last_name}`;
        const initials = `${p.first_name[0]}${p.last_name[0]}`;
        const statusKey = p.status.replace(/\s+/g, '-');
        return `
          <tr onclick="viewPatient('${p.patient_id}')">
            <td><code style="font-family:'JetBrains Mono',monospace;font-size:0.78rem;color:var(--accent)">${p.patient_id}</code></td>
            <td>
              <div class="td-name">
                <div class="td-avatar">${initials}</div>
                <div>
                  <div class="td-name-text">${name}</div>
                  <div class="td-name-sub">${p.email || '—'}</div>
                </div>
              </div>
            </td>
            <td class="td-age">${p.age || '?'} yrs<br><span style="font-size:0.75rem;color:var(--text3)">${p.gender}</span></td>
            <td><span style="font-family:'JetBrains Mono',monospace;font-weight:600;color:var(--text2)">${p.blood_type || '?'}</span></td>
            <td style="color:var(--text2)">${p.phone || '—'}</td>
            <td><span class="status-badge status-${statusKey}">${p.status}</span></td>
            <td onclick="event.stopPropagation()">
              <div class="action-btns">
                <button class="btn-icon edit" onclick="viewPatient('${p.patient_id}')">View</button>
                <button class="btn-icon" onclick="editPatient('${p.patient_id}')">Edit</button>
              </div>
            </td>
          </tr>
        `;
      }).join('');
    }
  } catch (e) {
    if (loader) loader.style.display = 'none';
    showToast('Failed to load patients', 'error');
  }
}

async function loadRecentPatients() {
  try {
    const res = await fetch(`${API}?action=get_patients&limit=5`);
    const data = await res.json();
    const container = document.getElementById('recentPatients');
    if (!container) return;

    const patients = data.patients || [];
    if (!patients.length) { container.innerHTML = '<p style="color:var(--text3);font-size:0.85rem;text-align:center;padding:1rem">No patients yet</p>'; return; }

    const colors = ['#0EA5E9,#6366F1', '#10B981,#0EA5E9', '#F59E0B,#EF4444', '#6366F1,#EC4899', '#EC4899,#F97316'];
    container.innerHTML = patients.map((p, i) => {
      const statusKey = p.status.replace(/\s+/g, '-');
      return `
        <div class="patient-mini" onclick="viewPatient('${p.patient_id}')">
          <div class="mini-avatar" style="background:linear-gradient(135deg,${colors[i % colors.length]})">${p.first_name[0]}${p.last_name[0]}</div>
          <div class="mini-info">
            <div class="mini-name">${p.first_name} ${p.last_name}</div>
            <div class="mini-id">${p.patient_id}</div>
          </div>
          <span class="status-badge status-${statusKey}">${p.status}</span>
        </div>
      `;
    }).join('');
  } catch {}
}

function filterPatients() {
  currentFilter = document.getElementById('searchInput').value;
  loadPatients(currentFilter, currentStatusFilter);
}

function filterByStatus(status, btn) {
  currentStatusFilter = status;
  document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
  btn.classList.add('active');
  loadPatients(currentFilter, currentStatusFilter);
}

// ===== VIEW PATIENT =====
async function viewPatient(id) {
  modalPatientId = id;
  try {
    const res = await fetch(`${API}?action=get_patient&id=${id}`);
    const p = await res.json();
    if (p.error) { showToast(p.error, 'error'); return; }

    document.getElementById('modalPatientName').textContent = `${p.first_name} ${p.last_name}`;
    document.getElementById('modalPatientId').textContent = p.patient_id;

    const statusKey = p.status.replace(/\s+/g, '-');

    document.getElementById('modalBody').innerHTML = `
      <div class="patient-detail-grid">
        <div class="detail-section">
          <h4>Personal Info</h4>
          <div class="detail-row"><span class="detail-label">Full Name</span><span class="detail-value">${p.first_name} ${p.last_name}</span></div>
          <div class="detail-row"><span class="detail-label">Date of Birth</span><span class="detail-value">${formatDate(p.date_of_birth)} (${p.age} yrs)</span></div>
          <div class="detail-row"><span class="detail-label">Gender</span><span class="detail-value">${p.gender}</span></div>
          <div class="detail-row"><span class="detail-label">Blood Type</span><span class="detail-value" style="font-family:'JetBrains Mono',monospace;font-weight:700;color:var(--red)">${p.blood_type || '—'}</span></div>
          <div class="detail-row"><span class="detail-label">Status</span><span class="detail-value"><span class="status-badge status-${statusKey}">${p.status}</span></span></div>
        </div>
        <div class="detail-section">
          <h4>Contact</h4>
          <div class="detail-row"><span class="detail-label">Phone</span><span class="detail-value">${p.phone || '—'}</span></div>
          <div class="detail-row"><span class="detail-label">Email</span><span class="detail-value">${p.email || '—'}</span></div>
          <div class="detail-row"><span class="detail-label">Address</span><span class="detail-value">${p.address || '—'}</span></div>
          <div class="detail-row"><span class="detail-label">Emergency Contact</span><span class="detail-value">${p.emergency_contact || '—'}</span></div>
          <div class="detail-row"><span class="detail-label">Emergency Phone</span><span class="detail-value">${p.emergency_phone || '—'}</span></div>
        </div>
        <div class="detail-section">
          <h4>Medical</h4>
          <div class="detail-row"><span class="detail-label">Insurance #</span><span class="detail-value" style="font-family:'JetBrains Mono',monospace">${p.insurance_number || '—'}</span></div>
          <div class="detail-row"><span class="detail-label">Allergies</span><span class="detail-value" style="color:var(--yellow)">${p.allergies || 'None reported'}</span></div>
          <div class="detail-row"><span class="detail-label">Chronic Conditions</span><span class="detail-value">${p.chronic_conditions || 'None reported'}</span></div>
        </div>
        <div class="detail-section">
          <h4>System</h4>
          <div class="detail-row"><span class="detail-label">Patient ID</span><span class="detail-value" style="font-family:'JetBrains Mono',monospace;color:var(--accent)">${p.patient_id}</span></div>
          <div class="detail-row"><span class="detail-label">Registered</span><span class="detail-value">${formatDateTime(p.created_at)}</span></div>
          <div class="detail-row"><span class="detail-label">Last Updated</span><span class="detail-value">${formatDateTime(p.updated_at)}</span></div>
        </div>
      </div>
    `;

    // Load medical records
    await loadMedRecords(id);

    document.getElementById('patientModal').classList.remove('hidden');
  } catch (e) {
    showToast('Failed to load patient', 'error');
  }
}

async function loadMedRecords(patientId) {
  const container = document.getElementById('modalRecords');
  container.innerHTML = '<div class="table-loader" style="padding:1rem"><div class="spinner"></div></div>';
  try {
    const res = await fetch(`${API}?action=get_records&patient_id=${patientId}`);
    const records = await res.json();

    if (!records.length) {
      container.innerHTML = '<p style="color:var(--text3);font-size:0.85rem;text-align:center;padding:1rem">No medical records yet. Click "+ Add Record" to add one.</p>';
      return;
    }

    container.innerHTML = records.map(r => `
      <div class="record-mini">
        <div class="record-mini-header">
          <div>
            <div class="record-mini-date">${formatDate(r.visit_date)}</div>
            <div class="record-mini-dept">${r.department || '—'}</div>
          </div>
          <button class="record-mini-delete" onclick="deleteMedRecord(${r.id}, '${patientId}')" title="Delete record">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>
          </button>
        </div>
        <div class="record-mini-diag">${r.diagnosis || '—'}</div>
        <div class="record-mini-doc">Dr: ${r.doctor_name || '—'} ${r.follow_up_date ? '· Follow-up: ' + formatDate(r.follow_up_date) : ''}</div>
        ${r.medications ? `<div style="font-size:0.75rem;color:var(--text3);margin-top:4px">Meds: ${r.medications}</div>` : ''}
      </div>
    `).join('');
  } catch {
    container.innerHTML = '<p style="color:var(--red);font-size:0.85rem;padding:1rem">Failed to load records.</p>';
  }
}

function showAddMedRecord() {
  document.getElementById('mr-patientId').value = modalPatientId;
  document.getElementById('mr-date').value = new Date().toISOString().slice(0, 10);
  document.getElementById('medRecordModal').classList.remove('hidden');
}

async function submitMedRecord(e) {
  e.preventDefault();
  const payload = {
    patient_id: document.getElementById('mr-patientId').value,
    visit_date: document.getElementById('mr-date').value,
    doctor_name: document.getElementById('mr-doctor').value,
    department: document.getElementById('mr-dept').value,
    diagnosis: document.getElementById('mr-diagnosis').value,
    symptoms: document.getElementById('mr-symptoms').value,
    treatment: document.getElementById('mr-treatment').value,
    medications: document.getElementById('mr-meds').value,
    notes: document.getElementById('mr-notes').value,
    follow_up_date: document.getElementById('mr-followup').value || null
  };

  try {
    const res = await fetch(`${API}?action=add_record`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.success) {
      closeModal('medRecordModal');
      document.getElementById('medRecordForm').reset();
      await loadMedRecords(payload.patient_id);
      showToast('Medical record saved successfully', 'success');
    } else {
      showToast(data.error || 'Failed to save record', 'error');
    }
  } catch { showToast('Connection error', 'error'); }
}

async function deleteMedRecord(id, patientId) {
  if (!confirm('Delete this medical record?')) return;
  try {
    const res = await fetch(`${API}?action=delete_record`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
    const data = await res.json();
    if (data.success) { await loadMedRecords(patientId); showToast('Record deleted', 'info'); }
  } catch { showToast('Failed to delete', 'error'); }
}

function closeModal(id) {
  document.getElementById(id).classList.add('hidden');
}

function editFromModal() {
  closeModal('patientModal');
  editPatient(modalPatientId);
}

async function editPatient(id) {
  try {
    const res = await fetch(`${API}?action=get_patient&id=${id}`);
    const p = await res.json();
    showPage('add-record');
    document.getElementById('addFormTitle').textContent = 'Edit Patient Record';
    document.getElementById('editPatientId').value = p.patient_id;
    document.getElementById('f-firstName').value = p.first_name;
    document.getElementById('f-lastName').value = p.last_name;
    document.getElementById('f-dob').value = p.date_of_birth;
    document.getElementById('f-gender').value = p.gender;
    document.getElementById('f-blood').value = p.blood_type || '';
    document.getElementById('f-status').value = p.status;
    document.getElementById('f-phone').value = p.phone || '';
    document.getElementById('f-email').value = p.email || '';
    document.getElementById('f-address').value = p.address || '';
    document.getElementById('f-emergencyContact').value = p.emergency_contact || '';
    document.getElementById('f-emergencyPhone').value = p.emergency_phone || '';
    document.getElementById('f-insurance').value = p.insurance_number || '';
    document.getElementById('f-allergies').value = p.allergies || '';
    document.getElementById('f-conditions').value = p.chronic_conditions || '';
    document.getElementById('submitPatientBtn').innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/></svg>
      Update Patient
    `;
  } catch { showToast('Failed to load patient data', 'error'); }
}

async function deleteFromModal() {
  if (!confirm(`Delete patient ${modalPatientId}? This action cannot be undone.`)) return;
  try {
    const res = await fetch(`${API}?action=delete_patient`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ patient_id: modalPatientId })
    });
    const data = await res.json();
    if (data.success) {
      closeModal('patientModal');
      showToast('Patient deleted successfully', 'info');
      loadPatients(currentFilter, currentStatusFilter);
    } else { showToast('Failed to delete patient', 'error'); }
  } catch { showToast('Connection error', 'error'); }
}

// ===== PATIENT FORM =====
async function submitPatient(e) {
  e.preventDefault();
  const editId = document.getElementById('editPatientId').value;
  const isEdit = !!editId;

  const payload = {
    patient_id: editId,
    first_name: document.getElementById('f-firstName').value,
    last_name: document.getElementById('f-lastName').value,
    date_of_birth: document.getElementById('f-dob').value,
    gender: document.getElementById('f-gender').value,
    blood_type: document.getElementById('f-blood').value,
    status: document.getElementById('f-status').value,
    phone: document.getElementById('f-phone').value,
    email: document.getElementById('f-email').value,
    address: document.getElementById('f-address').value,
    emergency_contact: document.getElementById('f-emergencyContact').value,
    emergency_phone: document.getElementById('f-emergencyPhone').value,
    insurance_number: document.getElementById('f-insurance').value,
    allergies: document.getElementById('f-allergies').value,
    chronic_conditions: document.getElementById('f-conditions').value
  };

  const btn = document.getElementById('submitPatientBtn');
  btn.disabled = true;
  btn.innerHTML = '<div class="spinner" style="width:18px;height:18px;border-width:2px"></div> Saving…';

  try {
    const action = isEdit ? 'update_patient' : 'add_patient';
    const res = await fetch(`${API}?action=${action}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.success) {
      showToast(isEdit ? 'Patient updated successfully!' : `Patient registered! ID: ${data.patient_id}`, 'success');
      resetPatientForm();
      showPage('records-list');
    } else {
      showToast(data.error || 'Failed to save patient', 'error');
    }
  } catch { showToast('Connection error', 'error'); }

  btn.disabled = false;
  btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/></svg> Register Patient`;
}

function resetPatientForm() {
  document.getElementById('patientForm').reset();
  document.getElementById('editPatientId').value = '';
  document.getElementById('addFormTitle').textContent = 'Register New Patient';
  document.getElementById('submitPatientBtn').innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/></svg>
    Register Patient
  `;
}

// ===== LOAD ALL RECORDS =====
async function loadAllRecords() {
  const container = document.getElementById('allRecordsTable');
  if (!container) return;
  container.innerHTML = '<div class="table-loader"><div class="spinner"></div></div>';
  try {
    const res = await fetch(`${API}?action=get_records`);
    const records = await res.json();
    if (!records.length) { container.innerHTML = '<p style="color:var(--text3);padding:1rem;text-align:center">No records found</p>'; return; }
    container.innerHTML = `
      <table>
        <thead>
          <tr>
            <th>Patient</th>
            <th>Visit Date</th>
            <th>Department</th>
            <th>Diagnosis</th>
            <th>Doctor</th>
            <th>Follow-up</th>
          </tr>
        </thead>
        <tbody>
          ${records.map(r => `
            <tr>
              <td style="font-weight:600">${r.patient_name || r.patient_id}</td>
              <td style="font-family:'JetBrains Mono',monospace;color:var(--accent)">${formatDate(r.visit_date)}</td>
              <td>${r.department || '—'}</td>
              <td>${r.diagnosis || '—'}</td>
              <td>${r.doctor_name || '—'}</td>
              <td>${r.follow_up_date ? formatDate(r.follow_up_date) : '—'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  } catch { container.innerHTML = '<p style="color:var(--red);padding:1rem">Failed to load records.</p>'; }
}

// ===== HISTORY =====
async function loadHistory() {
  const container = document.getElementById('historyList');
  const loader = document.getElementById('historyLoader');
  if (!container) return;

  if (loader) loader.style.display = 'flex';
  container.innerHTML = '';

  try {
    const res = await fetch(`${API}?action=get_history&limit=60`);
    const items = await res.json();
    if (loader) loader.style.display = 'none';

    const icons = {
      LOGIN: '→', LOGOUT: '←', CREATE: '+', UPDATE: '✎', DELETE: '✕', VIEW: '◉'
    };

    container.innerHTML = items.map(item => `
      <div class="history-item">
        <div class="history-icon hicon-${item.action}">${icons[item.action] || '•'}</div>
        <div class="history-content">
          <div class="history-action">${item.action} — ${item.entity_type} ${item.entity_id}</div>
          <div class="history-detail">${item.details || '—'}</div>
          <div class="history-meta">
            <span>By: ${item.performed_by}</span>
            <span>${formatDateTime(item.created_at)}</span>
          </div>
        </div>
      </div>
    `).join('');
  } catch {
    if (loader) loader.style.display = 'none';
    showToast('Failed to load history', 'error');
  }
}

// ===== HELPERS =====
function formatDate(d) {
  if (!d) return '—';
  return new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatDateTime(dt) {
  if (!dt) return '—';
  return new Date(dt).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function showToast(message, type = 'info') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast ${type}`;
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 3500);
}

// Close modals on overlay click
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.add('hidden');
  }
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-overlay').forEach(m => m.classList.add('hidden'));
  }
});
