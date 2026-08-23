
// ============================================
// HOMETURF 5-A-SIDE - Main Application
// ============================================

// Initialize default data if not exists
function initData() {
  if (!localStorage.getItem('hometurf_slots')) {
    const defaultSlots = [
      { id: 1, time: '08:00 - 09:00', price: 350, peak: false },
      { id: 2, time: '09:00 - 10:00', price: 350, peak: false },
      { id: 3, time: '10:00 - 11:00', price: 400, peak: false },
      { id: 4, time: '11:00 - 12:00', price: 400, peak: false },
      { id: 5, time: '12:00 - 13:00', price: 450, peak: true },
      { id: 6, time: '13:00 - 14:00', price: 450, peak: true },
      { id: 7, time: '14:00 - 15:00', price: 450, peak: true },
      { id: 8, time: '15:00 - 16:00', price: 500, peak: true },
      { id: 9, time: '16:00 - 17:00', price: 500, peak: true },
      { id: 10, time: '17:00 - 18:00', price: 550, peak: true },
      { id: 11, time: '18:00 - 19:00', price: 600, peak: true },
      { id: 12, time: '19:00 - 20:00', price: 600, peak: true },
      { id: 13, time: '20:00 - 21:00', price: 550, peak: true },
      { id: 14, time: '21:00 - 22:00', price: 500, peak: false }
    ];
    localStorage.setItem('hometurf_slots', JSON.stringify(defaultSlots));
  }

  if (!localStorage.getItem('hometurf_bookings')) {
    localStorage.setItem('hometurf_bookings', JSON.stringify({}));
  }

  if (!localStorage.getItem('hometurf_blocked')) {
    localStorage.setItem('hometurf_blocked', JSON.stringify({}));
  }

  if (!localStorage.getItem('hometurf_admin')) {
    localStorage.setItem('hometurf_admin', JSON.stringify({ loggedIn: false }));
  }
}

// Get data from localStorage
function getSlots() {
  return JSON.parse(localStorage.getItem('hometurf_slots')) || [];
}

function getBookings() {
  return JSON.parse(localStorage.getItem('hometurf_bookings')) || {};
}

function getBlocked() {
  return JSON.parse(localStorage.getItem('hometurf_blocked')) || {};
}

function getAdmin() {
  return JSON.parse(localStorage.getItem('hometurf_admin')) || { loggedIn: false };
}

// Save data to localStorage
function saveSlots(slots) {
  localStorage.setItem('hometurf_slots', JSON.stringify(slots));
}

function saveBookings(bookings) {
  localStorage.setItem('hometurf_bookings', JSON.stringify(bookings));
}

function saveBlocked(blocked) {
  localStorage.setItem('hometurf_blocked', JSON.stringify(blocked));
}

function saveAdmin(admin) {
  localStorage.setItem('hometurf_admin', JSON.stringify(admin));
}

// Generate date key
function getDateKey(date) {
  return date.toISOString().split('T')[0];
}

// Get next 7 days
function getNext7Days() {
  const days = [];
  const today = new Date();
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    days.push({
      date: date,
      key: getDateKey(date),
      dayName: i === 0 ? 'Today' : dayNames[date.getDay()],
      dayNum: date.getDate()
    });
  }
  return days;
}

// Mobile menu toggle
function initMobileMenu() {
  const menuBtn = document.querySelector('.mobile-menu-btn');
  const navLinks = document.querySelector('.nav-links');

  if (menuBtn && navLinks) {
    menuBtn.addEventListener('click', () => {
      navLinks.classList.toggle('active');
    });
  }
}

// FAQ Accordion
function initFAQ() {
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    question.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');
      faqItems.forEach(i => i.classList.remove('open'));
      if (!isOpen) item.classList.add('open');
    });
  });
}

// Modal functions
function showModal(title, message, callback) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay active';
  overlay.innerHTML = `
    <div class="modal">
      <h3>${title}</h3>
      <p>${message}</p>
      <button class="btn btn-primary mt-2" onclick="this.closest('.modal-overlay').remove(); ${callback || ''}">OK</button>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove();
  });
}

// Format currency
function formatPrice(price) {
  return 'R ' + price.toLocaleString();
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
  initData();
  initMobileMenu();
  initFAQ();
});
