// API Base URL
const API_URL = 'http://localhost:3000/api';

// Global State
let currentUser = null;
let allTickets = [];
let filteredTickets = [];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  checkAuthStatus();
});

function setupEventListeners() {
  // Auth Forms
  document.getElementById('login-form').addEventListener('submit', handleLogin);
  document.getElementById('register-form').addEventListener('submit', handleRegister);
  document.getElementById('new-ticket-form').addEventListener('submit', handleCreateTicket);

  // Rol değiştiğinde Departman seçimini göster/gizle
  const roleSelect = document.getElementById('register-role');
  const deptSelect = document.getElementById('register-department');
  
  if(roleSelect && deptSelect) {
      roleSelect.addEventListener('change', (e) => {
          if (['support', 'department'].includes(e.target.value)) {
              deptSelect.style.display = 'block';
              deptSelect.required = true;
              loadRegisterDepartments(); // Departmanları yükle
          } else {
              deptSelect.style.display = 'none';
              deptSelect.required = false;
          }
      });
  }
}

// Kayıt formu için departmanları yükle
async function loadRegisterDepartments() {
    try {
        const response = await fetch(`${API_URL}/departments`);
        const departments = await response.json();
        const select = document.getElementById('register-department');
        
        // Mevcut seçenekleri temizle (ilk seçenek hariç)
        while (select.options.length > 1) { select.remove(1); }

        departments.forEach(dept => {
            const option = document.createElement('option');
            option.value = dept.id;
            option.textContent = dept.name;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Departmanlar yüklenemedi', error);
    }
}

// Departmani yukle (Ticket Formu İçin)
function initializeDepartments() {
  loadDepartments();
}

function checkAuthStatus() {
  const user = localStorage.getItem('currentUser');
  if (user) {
    currentUser = JSON.parse(user);
    showSection('dashboard');
    loadDashboard();
  } else {
    showSection('auth-section');
  }
}

// Auth Functions
async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  const errorEl = document.getElementById('login-error');

  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (!response.ok) {
      errorEl.textContent = data.error || 'Giris basarisiz';
      errorEl.classList.add('show');
      return;
    }

    currentUser = data;
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    document.getElementById('login-form').reset();
    errorEl.classList.remove('show');
    showSection('dashboard');
    loadDashboard();
  } catch (error) {
    console.error('Login error:', error);
    errorEl.textContent = 'Bir hata olustur';
    errorEl.classList.add('show');
  }
}

async function handleRegister(e) {
  e.preventDefault();
  const email = document.getElementById('register-email').value;
  const password = document.getElementById('register-password').value;
  const student_id = document.getElementById('register-student-id').value;
  const role = document.getElementById('register-role').value;
  const department_id = document.getElementById('register-department').value; // Departman ID'sini al
  const errorEl = document.getElementById('register-error');

  try {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
          email, 
          password, 
          student_id, 
          role,
          department_id: department_id || null // Backend'e gönder
      })
    });

    const data = await response.json();

    if (!response.ok) {
      errorEl.textContent = data.error || 'Kayit basarisiz';
      errorEl.classList.add('show');
      return;
    }

    currentUser = data;
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    document.getElementById('register-form').reset();
    errorEl.classList.remove('show');
    showSection('dashboard');
    loadDashboard();
  } catch (error) {
    console.error('Register error:', error);
    errorEl.textContent = 'Bir hata olustur';
    errorEl.classList.add('show');
  }
}

function logout() {
  currentUser = null;
  localStorage.removeItem('currentUser');
  showSection('auth-section');
  document.getElementById('login-form').reset();
  document.getElementById('register-form').reset();
}

// Section Navigation
function showSection(sectionId) {
  document.querySelectorAll('.section').forEach(section => {
    section.classList.remove('active');
  });
  const section = document.getElementById(sectionId);
  if (section) {
    section.classList.add('active');
    
    if (sectionId === 'new-ticket') {
      setTimeout(() => {
        initializeDepartments();
      }, 100);
    }
  }
}

function switchTab(tab) {
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const tabs = document.querySelectorAll('.tab-btn');

  if (tab === 'login') {
    loginForm.classList.add('active');
    registerForm.classList.remove('active');
    tabs[0].classList.add('active');
    tabs[1].classList.remove('active');
  } else {
    loginForm.classList.remove('active');
    registerForm.classList.add('active');
    tabs[0].classList.remove('active');
    tabs[1].classList.add('active');
  }
}

// Dashboard
async function loadDashboard() {
  try {
    const response = await fetch(`${API_URL}/tickets`);
    allTickets = await response.json();
    updateDashboardStats();
    loadTickets();
  } catch (error) {
    console.error('Error loading dashboard:', error);
  }
}

function updateDashboardStats() {
  const total = allTickets.length;
  const open = allTickets.filter(t => t.status === 'open').length;
  const inProgress = allTickets.filter(t => t.status === 'in_progress').length;
  const resolved = allTickets.filter(t => t.status === 'resolved').length;

  document.getElementById('total-tickets').textContent = total;
  document.getElementById('open-tickets').textContent = open;
  document.getElementById('in-progress-tickets').textContent = inProgress;
  document.getElementById('resolved-tickets').textContent = resolved;
}

// Tickets
async function loadTickets() {
  try {
    let url = `${API_URL}/tickets`;
    
    // Eğer kullanıcı Support veya Departman ise, kendi departmanının ticketlarını görsün
    if ((currentUser.role === 'support' || currentUser.role === 'department') && currentUser.department_id) {
        url = `${API_URL}/departments/${currentUser.department_id}/tickets`;
    } 
    // Öğrenci ise kendi ticketlarını görsün
    else if (currentUser.role === 'student') {
        url = `${API_URL}/tickets/user/${currentUser.id}`;
    }

    const response = await fetch(url);
    allTickets = await response.json();
    filterTickets();
  } catch (error) {
    console.error('Error loading tickets:', error);
  }
}

function filterTickets() {
  const statusFilter = document.getElementById('status-filter').value;
  const priorityFilter = document.getElementById('priority-filter').value;

  filteredTickets = allTickets.filter(ticket => {
    const statusMatch = !statusFilter || ticket.status === statusFilter;
    const priorityMatch = !priorityFilter || ticket.priority === priorityFilter;
    return statusMatch && priorityMatch;
  });

  renderTickets();
}

function renderTickets() {
  const ticketsList = document.getElementById('tickets-list');
  ticketsList.innerHTML = '';

  if (filteredTickets.length === 0) {
    ticketsList.innerHTML = '<p>Ticket bulunamadi</p>';
    return;
  }

  filteredTickets.forEach(ticket => {
    const statusBadgeClass = `badge-${ticket.status}`;
    const priorityBadgeClass = `badge-${ticket.priority}`;
    const statusText = getStatusText(ticket.status);
    const priorityText = getPriorityText(ticket.priority);

    // Ticket kime atanmış?
    let assignedInfo = ticket.assigned_to ? `<span style="font-size:0.8rem; color:#e67e22; margin-left:10px;">👤 Atanan: ID ${ticket.assigned_to}</span>` : '';

    const ticketEl = document.createElement('div');
    ticketEl.className = 'ticket-item';
    ticketEl.innerHTML = `
      <div class="ticket-header">
        <div class="ticket-title">
            #${ticket.id} - ${ticket.title} 
            ${assignedInfo}
        </div>
        <div>
          <span class="ticket-badge ${statusBadgeClass}">${statusText}</span>
          <span class="ticket-badge ${priorityBadgeClass}">${priorityText}</span>
        </div>
      </div>
      <p>${ticket.description || 'Aciklama yok'}</p>
      <div class="ticket-meta">
        <span>Kategori: ${ticket.category || 'Belirtilmemis'}</span>
        <span>Olusturulma: ${new Date(ticket.created_at).toLocaleDateString('tr-TR')}</span>
      </div>
    `;
    ticketEl.onclick = () => viewTicketDetail(ticket.id);
    ticketsList.appendChild(ticketEl);
  });
}

// TICKET DETAY
async function viewTicketDetail(ticketId) {
  try {
    const response = await fetch(`${API_URL}/tickets/${ticketId}`);
    const ticket = await response.json();

    const commentsResponse = await fetch(`${API_URL}/tickets/${ticketId}/comments`);
    const comments = await commentsResponse.json();

    // AI Önerileri (Sadece Admin ve Support görsün)
    let aiSuggestions = null;
    if (['support', 'admin'].includes(currentUser.role)) {
        try {
            const aiResponse = await fetch(`${API_URL}/tickets/${ticketId}/ai-suggestions`, { method: 'POST' });
            if (aiResponse.ok) aiSuggestions = await aiResponse.json();
        } catch (e) { console.error("AI Hatası:", e); }
    }

    // Support Staff Listesi (Sadece Departman Yöneticisi için)
    let supportStaff = [];
    if (currentUser.role === 'department') {
        try {
             // Kullanıcının kendi departmanındaki destekçileri çek
            const staffResp = await fetch(`${API_URL}/users/support/${currentUser.department_id}`);
            if (staffResp.ok) supportStaff = await staffResp.json();
        } catch (e) { console.error("Personel çekilemedi", e); }
    }

    renderTicketDetail(ticket, comments, aiSuggestions, supportStaff);
    showSection('ticket-detail');
  } catch (error) {
    console.error('Error loading ticket detail:', error);
  }
}

function renderTicketDetail(ticket, comments, aiSuggestions, supportStaff) {
  const statusText = getStatusText(ticket.status);
  const priorityText = getPriorityText(ticket.priority);
  const statusBadgeClass = `badge-${ticket.status}`;
  const priorityBadgeClass = `badge-${ticket.priority}`;
  
  let html = `
    <div class="ticket-detail-header">
      <div>
        <div class="ticket-detail-title">#${ticket.id} - ${ticket.title}</div>
        <div style="margin-top: 0.5rem;">
          <span class="ticket-badge ${statusBadgeClass}">${statusText}</span>
          <span class="ticket-badge ${priorityBadgeClass}">${priorityText}</span>
        </div>
      </div>
    </div>
  `;

  // === ROL BAZLI PANEL ===
  
  // 1. Durum: DEPARTMAN YÖNETİCİSİ (Atama Yapar)
  if (currentUser.role === 'department') {
      html += `
      <div style="background-color: #fff3cd; padding: 15px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #ffeeba;">
          <h3 style="color: #856404; margin-bottom: 10px;">👔 Departman Yönetimi</h3>
          <p>Bu görevi bir personele atayın:</p>
          <div style="display: flex; gap: 10px;">
              <select id="assign-support" class="form-control">
                  <option value="">-- Personel Seç --</option>
                  ${supportStaff.map(s => `<option value="${s.id}" ${ticket.assigned_to === s.id ? 'selected' : ''}>${s.email}</option>`).join('')}
              </select>
              <button onclick="assignTicket(${ticket.id})" class="btn btn-primary">Atama Yap</button>
          </div>
      </div>`;
  }

  // 2. Durum: DESTEK PERSONELİ (İş Yapar)
  if (currentUser.role === 'support' || currentUser.role === 'admin') {
      html += `
      <div style="background-color: #d4edda; padding: 15px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #c3e6cb;">
          <h3 style="color: #155724; margin-bottom: 10px;">🛠️ Destek İşlemleri</h3>
          
          ${aiSuggestions ? `
            <div style="background: white; padding: 10px; border-radius: 4px; margin-bottom: 10px; font-size: 0.9rem;">
                <strong>🤖 AI Özeti:</strong> ${aiSuggestions.summary || 'Yok'}<br>
                <strong>📝 Taslak Cevap:</strong> <i>"${aiSuggestions.response_draft || 'Yok'}"</i>
            </div>
          ` : ''}

          <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
              <label>Durum:</label>
              <select id="update-status" class="form-control">
                  <option value="open" ${ticket.status === 'open' ? 'selected' : ''}>Açık</option>
                  <option value="in_progress" ${ticket.status === 'in_progress' ? 'selected' : ''}>İşlemde</option>
                  <option value="resolved" ${ticket.status === 'resolved' ? 'selected' : ''}>Çözüldü</option>
              </select>

              <label>Öncelik:</label>
              <select id="update-priority" class="form-control">
                  <option value="low" ${ticket.priority === 'low' ? 'selected' : ''}>Düşük</option>
                  <option value="medium" ${ticket.priority === 'medium' ? 'selected' : ''}>Orta</option>
                  <option value="high" ${ticket.priority === 'high' ? 'selected' : ''}>Yüksek</option>
              </select>

              <button onclick="updateTicketStatus(${ticket.id})" class="btn btn-success">Güncelle</button>
          </div>
      </div>`;
  }

  html += `
    <div class="ticket-detail-info">
      <div class="info-item">
        <div class="info-label">Kategori</div>
        <div class="info-value">${ticket.category || 'Belirtilmemis'}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Atanan Personel ID</div>
        <div class="info-value">${ticket.assigned_to || 'Henüz atanmadı'}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Olusturulma Tarihi</div>
        <div class="info-value">${new Date(ticket.created_at).toLocaleDateString('tr-TR')}</div>
      </div>
    </div>

    <div class="ticket-description">
      <h3>Aciklama</h3>
      <p>${ticket.description || 'Aciklama yok'}</p>
    </div>

    <div class="comments-section">
      <h3>Yorumlar (${comments.length})</h3>
  `;

  comments.forEach(comment => {
    html += `
      <div class="comment">
        <div class="comment-author">${comment.email}</div>
        <div class="comment-date">${new Date(comment.created_at).toLocaleDateString('tr-TR')}</div>
        <div class="comment-text">${comment.comment_text}</div>
      </div>
    `;
  });

  html += `
      <div class="add-comment-form">
        <textarea id="comment-text" placeholder="Yorum ekle..." rows="3"></textarea>
        <button class="btn btn-primary" onclick="addComment(${ticket.id})">Yorum Ekle</button>
      </div>
    </div>
  `;

  document.getElementById('ticket-detail-content').innerHTML = html;
}

// Departman Atama İşlemi
async function assignTicket(ticketId) {
    const assignedTo = document.getElementById('assign-support').value;
    if (!assignedTo) return alert("Lütfen bir personel seçin!");

    try {
        const response = await fetch(`${API_URL}/tickets/${ticketId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ assigned_to: assignedTo })
        });

        if (response.ok) {
            alert("Atama başarıyla yapıldı!");
            viewTicketDetail(ticketId);
        }
    } catch (error) {
        console.error("Atama hatası:", error);
    }
}

// Destek Durum Güncelleme İşlemi
async function updateTicketStatus(ticketId) {
    const newStatus = document.getElementById('update-status').value;
    const newPriority = document.getElementById('update-priority').value;

    try {
        const response = await fetch(`${API_URL}/tickets/${ticketId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                status: newStatus,
                priority: newPriority,
                updated_by: currentUser.id
            })
        });

        if (response.ok) {
            alert('Ticket güncellendi! ' + (newStatus === 'resolved' ? 'Kullanıcıya bildirim gönderildi.' : ''));
            viewTicketDetail(ticketId);
            loadDashboard();
        }
    } catch (error) {
        console.error('Error updating ticket:', error);
    }
}

async function addComment(ticketId) {
  const commentText = document.getElementById('comment-text').value;
  if (!commentText.trim()) {
    alert('Lutfen bir yorum yazin');
    return;
  }

  try {
    const response = await fetch(`${API_URL}/tickets/${ticketId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: currentUser.id,
        comment_text: commentText
      })
    });

    if (response.ok) {
      document.getElementById('comment-text').value = '';
      viewTicketDetail(ticketId);
    }
  } catch (error) {
    console.error('Error adding comment:', error);
  }
}

// Create Ticket
async function handleCreateTicket(e) {
  e.preventDefault();
  const title = document.getElementById('ticket-title').value;
  const description = document.getElementById('ticket-description').value;
  const category = document.getElementById('ticket-category').value;
  const priority = document.getElementById('ticket-priority').value;
  const department_id = document.getElementById('ticket-department').value;
  const errorEl = document.getElementById('ticket-error');
  const successEl = document.getElementById('ticket-success');

  try {
    const response = await fetch(`${API_URL}/tickets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: currentUser.id,
        title,
        description,
        category,
        priority,
        department_id: department_id || null
      })
    });

    const data = await response.json();

    if (!response.ok) {
      errorEl.textContent = data.error || 'Ticket olusturulamadi';
      errorEl.classList.add('show');
      return;
    }

    successEl.textContent = 'Ticket basariyla olusturuldu!';
    successEl.classList.add('show');
    document.getElementById('new-ticket-form').reset();
    errorEl.classList.remove('show');

    setTimeout(() => {
      loadDashboard();
      showSection('tickets');
    }, 1500);
  } catch (error) {
    console.error('Error creating ticket:', error);
    errorEl.textContent = 'Bir hata olustur';
    errorEl.classList.add('show');
  }
}

// Departments
async function loadDepartments() {
  try {
    const response = await fetch(`${API_URL}/departments`);
    const departments = await response.json();
    
    const select = document.getElementById('ticket-department');
    if (!select) return;
    
    while (select.options.length > 1) {
      select.remove(1);
    }
    
    if (departments && Array.isArray(departments)) {
      departments.forEach(dept => {
        const option = document.createElement('option');
        option.value = dept.id;
        option.textContent = dept.name;
        select.appendChild(option);
      });
    }
  } catch (error) {
    console.error('Departman yukleme hatasi:', error);
  }
}

// Helper Functions
function getStatusText(status) {
  const statusMap = {
    'open': 'Acik',
    'in_progress': 'Devam Eden',
    'resolved': 'Cozulen',
    'closed': 'Kapali'
  };
  return statusMap[status] || status;
}

function getPriorityText(priority) {
  const priorityMap = {
    'low': 'Dusuk',
    'medium': 'Orta',
    'high': 'Yuksek'
  };
  return priorityMap[priority] || priority;
}