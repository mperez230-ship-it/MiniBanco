// CONFIG / ESTADO GLOBAL
const API_BASE = "https://minibanco-x5nd.onrender.com";

let currentUser = null;
let accounts = [];
let transactions = [];

// =======================
// UTILIDADES UI
function showAlert(message, type = 'info') {
  const container = document.getElementById('alertContainer');
  if (!container) {
    console[type === 'error' ? 'error' : 'log'](message);
    return;
  }
  const alert = document.createElement('div');
  alert.className = `alert alert-${type === 'error' ? 'error' : type === 'success' ? 'success' : 'info'} show`;
  alert.textContent = message;
  container.appendChild(alert);
  setTimeout(() => alert.remove(), 4500);
}

function switchTab(event, tab) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(tc => tc.classList.remove('active'));
  if (event && event.target) event.target.classList.add('active');
  const tabEl = document.getElementById(`tab-${tab}`);
  if (tabEl) tabEl.classList.add('active');
  if (tab === 'movimientos') fetchTransactions();
  else if (tab === 'estadisticas') updateStatistics();
}

function logoutUser() {
  if (confirm('¿Cerrar sesión?')) {
    currentUser = null;
    accounts = [];
    transactions = [];
    ['mainContent','userCard','accountCreation'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = 'none';
    });
    ['loginCard','userRegistration','welcomeMessage'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = 'block';
    });
    const userForm = document.getElementById('userForm');
    if (userForm) userForm.reset();
    showAlert('Sesión cerrada correctamente', 'info');
  }
}

// =======================
// RENDER FUNCTIONS
function renderAccounts() {
  const list = document.getElementById('accountsList');
  if (!list) return;
  if (!accounts || accounts.length === 0) {
    list.innerHTML = '<div class="empty-state"><p>No tienes cuentas registradas</p></div>';
    return;
  }

  list.innerHTML = accounts.map(acc => {
    const canDelete = currentUser?.role === 'admin';
    const isOwner = acc.userId === currentUser?.id;

    return `
    <div class="account-card">
      <div class="account-header">
        <div>
          <span class="account-id">📌 ${acc.id}</span>
          <span class="account-type">${acc.type}</span>
          ${currentUser?.role === 'admin' && !isOwner ? `<span style="font-size:0.8em;color:#666;margin-left:8px;">(Usuario: ${acc.userId})</span>` : ''}
        </div>
      </div>
      <div class="account-balance">$${(acc.balance || 0).toLocaleString('es-CO')}</div>
      <div class="account-actions">
        ${isOwner || currentUser?.role === 'admin' ? `
          <button class="btn btn-success btn-small" onclick="openTransactionModal('${acc.id}', 'consignacion')">💰 Consignar</button>
          <button class="btn btn-danger btn-small" onclick="openTransactionModal('${acc.id}', 'retiro')">💸 Retirar</button>
        ` : ''}
        ${canDelete ? `<button class="btn btn-danger btn-small" onclick="deleteAccount('${acc.id}')">🗑️ Eliminar</button>` : ''}
      </div>
    </div>
  `;
  }).join('');
}

function renderTransactions() {
  const list = document.getElementById('transactionsList');
  if (!list) return;
  const filtered = filterTransactionsByAccount();

  if (!filtered || filtered.length === 0) {
    list.innerHTML = '<div class="empty-state"><p>No hay transacciones</p></div>';
    return;
  }

  list.innerHTML = filtered.map(tx => `
    <div class="transaction ${tx.type === 'consignacion' ? 'positive' : 'negative'}">
      <div>
        <strong>${tx.type === 'consignacion' ? '💰' : '💸'} ${tx.description || tx.type}</strong>
        <div style="font-size:0.85em;color:#666;">Cuenta: ${tx.accountId} | ${tx.date || ''}</div>
      </div>
      <div class="transaction-amount ${tx.type === 'consignacion' ? 'positive' : 'negative'}">
        ${tx.type === 'consignacion' ? '+' : '-'}$${(tx.amount || 0).toLocaleString('es-CO')}
      </div>
    </div>
  `).join('');
}

function updateAccountFilter() {
  const select = document.getElementById('filterAccount');
  if (!select) return;
  select.innerHTML = '<option value="all">Todas las cuentas</option>' +
    accounts.map(acc => `<option value="${acc.id}">${acc.id} (${acc.type})</option>`).join('');
}

function filterTransactionsByAccount() {
  const filter = document.getElementById('filterAccount')?.value;
  if (!filter || filter === 'all') return transactions;
  return transactions.filter(tx => tx.accountId === filter);
}

function filterTransactions() {
  renderTransactions();
}

function updateStatistics() {
  const userAccounts = currentUser?.role === 'admin'
    ? accounts
    : accounts.filter(acc => acc.userId === currentUser?.id);

  const totalAccountsEl = document.getElementById('totalAccounts');
  if (totalAccountsEl) totalAccountsEl.textContent = userAccounts.length;

  const totalBalance = userAccounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);
  const totalBalanceEl = document.getElementById('totalBalance');
  if (totalBalanceEl) totalBalanceEl.textContent = `$${totalBalance.toLocaleString('es-CO')}`;

  const totalTxs = transactions.filter(tx => userAccounts.some(acc => acc.id === tx.accountId)).length;
  const totalTxsEl = document.getElementById('totalTransactions');
  if (totalTxsEl) totalTxsEl.textContent = totalTxs;

  const summary = document.getElementById('accountSummary');
  if (!summary) return;
  summary.innerHTML = userAccounts.map(acc => {
    const accTxs = transactions.filter(tx => tx.accountId === acc.id);
    return `
      <div class="account-card">
        <h4>${acc.id} - ${acc.type}</h4>
        <p><strong>Saldo:</strong> $${(acc.balance || 0).toLocaleString('es-CO')}</p>
        <p><strong>Transacciones:</strong> ${accTxs.length}</p>
      </div>
    `;
  }).join('');
}

// =======================
// MODAL
function openTransactionModal(accountId, type) {
  const acc = accounts.find(a => a.id === accountId);
  if (!acc) return;

  const isOwner = acc.userId === currentUser?.id;
  const isAdmin = currentUser?.role === 'admin';

  if (!isOwner && !isAdmin) {
    showAlert('No tienes permiso para hacer transacciones en esta cuenta', 'error');
    return;
  }

  const transAccIdEl = document.getElementById('transAccId');
  const transTypeEl = document.getElementById('transType');
  const transAccDisplayEl = document.getElementById('transAccDisplay');
  if (transAccIdEl) transAccIdEl.value = accountId;
  if (transTypeEl) transTypeEl.value = type;
  if (transAccDisplayEl) transAccDisplayEl.value = `${acc.id} - ${acc.type}`;
  const modalTitle = document.getElementById('modalTitle');
  if (modalTitle) modalTitle.textContent = type === 'consignacion' ? '💰 Consignar Dinero' : '💸 Retirar Dinero';
  const transAmountEl = document.getElementById('transAmount');
  if (transAmountEl) transAmountEl.value = '';
  const modal = document.getElementById('transactionModal');
  if (modal) modal.style.display = 'flex';
}

function closeModal() {
  const modal = document.getElementById('transactionModal');
  if (modal) modal.style.display = 'none';
  const form = document.getElementById('transactionForm');
  if (form) form.reset();
}

// =======================
// LLAMADAS AL BACKEND
async function loginUser(id, password) {
  const res = await fetch(`${API_BASE}/users/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, password })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error en login');
  return data;
}

async function registerUser(id, name, password) {
  const res = await fetch(`${API_BASE}/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, name, password })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al registrar usuario');
  return data;
}

async function fetchUsers() {
  if (!currentUser || currentUser.role !== 'admin') {
    const usersListEl = document.getElementById('usersList');
    if (usersListEl) usersListEl.innerHTML = '<p>Solo el administrador puede ver los usuarios</p>';
    return;
  }
  const res = await fetch(`${API_BASE}/users?role=admin`);
  const users = await res.json();
  const list = document.getElementById('usersList');
  if (!list) return;
  if (!users || users.length === 0) list.innerHTML = '<p>No hay usuarios registrados</p>';
  else {
    list.innerHTML = users.map(u => `
      <div class="users-list-item">
        <div>
          <strong>${u.name}</strong> (${u.id}) ${u.role === 'admin' ? '<span style="color:#007bff">(Admin)</span>' : ''}
        </div>
        <div>
          ${u.role !== 'admin' && u.id !== 'admin' ? `<button class="btn btn-danger btn-small" onclick="deleteUser('${u.id}')">Eliminar</button>` : ''}
        </div>
      </div>
    `).join('');
  }
}

async function deleteUser(userId) {
  if (!confirm(`¿Eliminar el usuario ${userId}?`)) return;
  const res = await fetch(`${API_BASE}/users/${userId}?role=${currentUser?.role}`, { method: 'DELETE' });
  const data = await res.json();
  if (!res.ok) showAlert(data.error || 'Error al eliminar usuario', 'error');
  else {
    showAlert('Usuario eliminado correctamente', 'success');
    fetchUsers();
  }
}

async function fetchAccounts() {
  if (!currentUser) return;
  const res = await fetch(`${API_BASE}/accounts?userId=${currentUser.id}&role=${currentUser.role}`);
  accounts = await res.json();
  renderAccounts();
  updateAccountFilter();
  updateStatistics();
}

async function fetchTransactions() {
  if (!currentUser) return;
  const res = await fetch(`${API_BASE}/transactions?userId=${currentUser.id}&role=${currentUser.role}`);
  transactions = await res.json();
  renderTransactions();
  updateStatistics();
}

async function createAccount(accountObj) {
  const res = await fetch(`${API_BASE}/accounts?userId=${currentUser.id}&role=${currentUser.role}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(accountObj)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al crear cuenta');
  return data;
}

async function doTransaction(txObj) {
  const res = await fetch(`${API_BASE}/transactions?userId=${currentUser.id}&role=${currentUser.role}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(txObj)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error en transacción');
  return data;
}

async function deleteAccount(accountId) {
  if (currentUser?.role !== 'admin') {
    showAlert('Solo el administrador puede eliminar cuentas', 'error');
    return;
  }

  if (!confirm(`¿Eliminar cuenta ${accountId}? Esta acción no se puede deshacer.`)) return;

  const res = await fetch(`${API_BASE}/accounts/${accountId}?userId=${currentUser.id}&role=${currentUser.role}`, {
    method: 'DELETE'
  });
  const data = await res.json();
  if (!res.ok) showAlert(data.error || 'Error al eliminar cuenta', 'error');
  else {
    showAlert('Cuenta eliminada correctamente', 'success');
    fetchAccounts();
    fetchTransactions();
  }
}

// =======================
// SERVICIOS EXTERNOS VISUALES (REST + SOAP)
// testRestCustom() y testSoapService() son funciones globales usadas por el HTML
async function testRestCustom() {
  try {
    const base = document.getElementById('currencyBase')?.value || 'USD';
    const res = await fetch(`${API_BASE}/external/rates?base=${encodeURIComponent(base)}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data || !data.rates) throw new Error('Datos inválidos del servicio REST');

    // Mostrar resumen
    const serviceResult = document.getElementById('serviceResult');
    if (serviceResult) {
      serviceResult.innerHTML = `
        <div class="service-card rest-card">
          <h3>💹 REST Service</h3>
          <p><strong>Base:</strong> ${data.base || base} &nbsp; <small>${data.date || ''}</small></p>
          <div style="max-height:140px;overflow:auto;"><ul>
            ${Object.entries(data.rates).slice(0,50).map(([c,r]) => `<li>${c}: ${Number(r).toFixed(6)}</li>`).join('')}
          </ul></div>
        </div>
      `;
    }

    // Poblar select restTarget si existe
    const targetSelect = document.getElementById('restTarget');
    if (targetSelect) {
      targetSelect.innerHTML = `<option value="">-- Seleccione moneda --</option>` +
        Object.keys(data.rates).map(c => `<option value="${c}">${c}</option>`).join('');
      // seleccionar primera por defecto
      const first = Object.keys(data.rates)[0];
      if (first) targetSelect.value = first;
    }

    // Conectar conversión si hay inputs
    const amountInput = document.getElementById('restAmount');
    const convertResult = document.getElementById('convertResult');

    function doConversion() {
      if (!targetSelect || !amountInput || !convertResult) return;
      const amount = parseFloat(amountInput.value);
      const target = targetSelect.value;
      if (!target) {
        convertResult.innerHTML = `<div class="service-card info-card">Selecciona moneda destino</div>`;
        return;
      }
      if (isNaN(amount)) {
        convertResult.innerHTML = `<div class="service-card info-card">Ingresa un monto válido</div>`;
        return;
      }
      const rate = data.rates[target];
      if (!rate) {
        convertResult.innerHTML = `<div class="service-card error-card">Tasa no disponible</div>`;
        return;
      }
      const converted = amount * Number(rate);
      convertResult.innerHTML = `
        <div class="service-card rest-conv-card">
          <p><strong>${amount}</strong> ${data.base} = <strong>${converted.toFixed(2)}</strong> ${target}</p>
          <p style="font-size:0.85em;color:#666;">1 ${data.base} = ${Number(rate).toFixed(6)} ${target}</p>
        </div>
      `;
    }

    if (amountInput) amountInput.oninput = doConversion;
    if (targetSelect) targetSelect.onchange = doConversion;
    // run once
    doConversion();

  } catch (err) {
    const el = document.getElementById('serviceResult');
    if (el) el.innerHTML = `<div class="service-card error-card"><strong>Error REST:</strong> ${err.message || err}</div>`;
    console.error('[testRestCustom] Error:', err);
  }
}

async function testSoapService(a, b) {
  // opción: si pasan a y b como parámetros, usar; sino leer inputs
  try {
    const aEl = document.getElementById('soapInputA');
    const bEl = document.getElementById('soapInputB');
    const aVal = (typeof a === 'number') ? a : parseFloat(aEl?.value);
    const bVal = (typeof b === 'number') ? b : parseFloat(bEl?.value);

    if (isNaN(aVal) || isNaN(bVal)) {
      const out = document.getElementById('soapOutput');
      if (out) out.innerHTML = "<span style='color:red;'>Debes ingresar dos números válidos</span>";
      return;
    }

    const res = await fetch(`${API_BASE}/external/add?a=${encodeURIComponent(aVal)}&b=${encodeURIComponent(bVal)}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const out = document.getElementById('soapOutput');
    if (out) out.innerHTML = `<strong>SOAP OK:</strong> ${aVal} + ${bVal} = ${data.result}`;
  } catch (err) {
    const out = document.getElementById('soapOutput');
    if (out) out.innerHTML = `<span style="color:red;">Error SOAP: ${err.message || err}</span>`;
    console.error('[testSoapService] Error:', err);
  }
}

// =======================
// EVENTOS PRINCIPALES
document.addEventListener('DOMContentLoaded', () => {
  // Login
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async e => {
      e.preventDefault();
      const id = document.getElementById('loginId').value.trim();
      const password = document.getElementById('loginPassword').value;
      if (!id || !password) return showAlert('Ingrese ID y contraseña', 'error');
      try {
        const user = await loginUser(id, password);
        currentUser = user;
        const welcomeMsg = user.role === 'admin' ? `Bienvenido Administrador ${user.name}` : `Bienvenido ${user.name}`;
        showAlert(welcomeMsg, 'success');
        // show/hide UI
        ['loginCard','userRegistration','welcomeMessage'].forEach(id => { const el = document.getElementById(id); if (el) el.style.display = 'none'; });
        ['userCard','accountCreation','mainContent'].forEach(id => { const el = document.getElementById(id); if (el) el.style.display = 'block'; });
        document.getElementById('displayUserId') && (document.getElementById('displayUserId').textContent = user.id);
        document.getElementById('displayUserName') && (document.getElementById('displayUserName').textContent = user.name);
        document.getElementById('displayUserRole') && (document.getElementById('displayUserRole').textContent = user.role === 'admin' ? '🔑 Rol: Administrador' : 'Rol: Usuario');
        fetchUsers();
        fetchAccounts();
        fetchTransactions();
      } catch (err) {
        showAlert(err.message, 'error');
      }
    });
  }

  // Registro de usuario
  const userForm = document.getElementById('userForm');
  if (userForm) {
    userForm.addEventListener('submit', async e => {
      e.preventDefault();
      const id = document.getElementById('userId').value.trim();
      const name = document.getElementById('userName').value.trim();
      const password = document.getElementById('userPassword').value;
      if (!id || !name || !password) return showAlert('Complete todos los campos', 'error');
      try {
        await registerUser(id, name, password);
        showAlert('Usuario registrado correctamente. Ahora puedes iniciar sesión.', 'success');
        userForm.reset();
      } catch (err) {
        showAlert(err.message, 'error');
      }
    });
  }

  // Crear cuenta
  const accountForm = document.getElementById('accountForm');
  if (accountForm) {
    accountForm.addEventListener('submit', async e => {
      e.preventDefault();
      if (!currentUser) return showAlert('Inicie sesión primero', 'error');
      const id = document.getElementById('accountId').value.trim();
      const type = document.getElementById('accountType').value;
      const initialDeposit = parseFloat(document.getElementById('initialDeposit').value) || 0;
      if (!id || !type) return showAlert('Complete los datos de la cuenta', 'error');
      try {
        await createAccount({
          id,
          type,
          balance: initialDeposit,
          userId: currentUser.id,
          createdAt: new Date().toLocaleString('es-CO')
        });
        showAlert('Cuenta creada correctamente', 'success');
        accountForm.reset();
        fetchAccounts();
        fetchTransactions();
      } catch (err) {
        showAlert(err.message, 'error');
      }
    });
  }

  // Transacciones
  const transactionForm = document.getElementById('transactionForm');
  if (transactionForm) {
    transactionForm.addEventListener('submit', async e => {
      e.preventDefault();
      const accountId = document.getElementById('transAccId').value;
      const type = document.getElementById('transType').value;
      const amount = parseFloat(document.getElementById('transAmount').value);
      if (!accountId || !type || !amount || amount <= 0) return showAlert('Datos inválidos', 'error');
      try {
        await doTransaction({
          accountId,
          type,
          amount,
          description: type === 'consignacion' ? 'Consignación' : 'Retiro',
          date: new Date().toLocaleString('es-CO')
        });
        closeModal();
        fetchAccounts();
        fetchTransactions();
        updateStatistics();
        showAlert('Transacción realizada correctamente', 'success');
      } catch (err) {
        showAlert(err.message, 'error');
      }
    });
  }

  // SOAP form
  const soapForm = document.getElementById('soapForm');
  if (soapForm) {
    soapForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      await testSoapService();
    });
  }

  // REST custom button
  const restBtn = document.getElementById('restCustomBtn');
  if (restBtn) restBtn.addEventListener('click', testRestCustom);

  // Cerrar modal al hacer clic fuera
  window.onclick = function(event) {
    const modal = document.getElementById('transactionModal');
    if (event.target === modal) closeModal();
  };
});
