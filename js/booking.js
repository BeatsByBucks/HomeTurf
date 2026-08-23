
// ============================================
// HOMETURF 5-A-SIDE - Booking System
// ============================================

let selectedDate = null;
let selectedSlots = [];

function initBooking() {
  renderDateSelector();
  // Select today by default
  const todayBtn = document.querySelector('.date-btn');
  if (todayBtn) todayBtn.click();
}

function renderDateSelector() {
  const container = document.getElementById('dateSelector');
  if (!container) return;

  const days = getNext7Days();
  container.innerHTML = days.map((day, index) => `
    <button class="date-btn ${index === 0 ? 'active' : ''}" data-date="${day.key}" onclick="selectDate('${day.key}', this)">
      <div class="day-name">${day.dayName}</div>
      <div class="day-num">${day.dayNum}</div>
    </button>
  `).join('');
}

function selectDate(dateKey, btn) {
  selectedDate = dateKey;
  selectedSlots = [];

  // Update active state
  document.querySelectorAll('.date-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  renderTimeSlots();
  updateBookingSummary();
}

function renderTimeSlots() {
  const container = document.getElementById('timeSlots');
  if (!container || !selectedDate) return;

  const slots = getSlots();
  const bookings = getBookings();
  const blocked = getBlocked();

  const dayBookings = bookings[selectedDate] || [];
  const dayBlocked = blocked[selectedDate] || [];

  container.innerHTML = slots.map(slot => {
    const isBooked = dayBookings.includes(slot.id);
    const isBlocked = dayBlocked.includes(slot.id);
    const isSelected = selectedSlots.includes(slot.id);

    let statusClass = '';
    let statusText = '';
    if (isBooked) {
      statusClass = 'booked';
      statusText = '<div style="font-size:0.75rem;color:#dc3545;margin-top:0.25rem;">Booked</div>';
    } else if (isBlocked) {
      statusClass = 'blocked';
      statusText = '<div style="font-size:0.75rem;color:#6c757d;margin-top:0.25rem;">Unavailable</div>';
    } else if (isSelected) {
      statusClass = 'selected';
    }

    return `
      <div class="time-slot ${statusClass}" data-id="${slot.id}" onclick="toggleSlot(${slot.id}, this)">
        <div class="slot-time">${slot.time}</div>
        <div class="slot-price">${formatPrice(slot.price)}</div>
        ${slot.peak ? '<div style="font-size:0.75rem;color:#ffc107;">Peak</div>' : ''}
        ${statusText}
      </div>
    `;
  }).join('');
}

function toggleSlot(slotId, element) {
  if (element.classList.contains('booked') || element.classList.contains('blocked')) return;

  const index = selectedSlots.indexOf(slotId);
  if (index > -1) {
    selectedSlots.splice(index, 1);
    element.classList.remove('selected');
  } else {
    selectedSlots.push(slotId);
    element.classList.add('selected');
  }

  updateBookingSummary();
}

function updateBookingSummary() {
  const container = document.getElementById('bookingSummary');
  if (!container) return;

  const slots = getSlots();
  const selectedSlotData = slots.filter(s => selectedSlots.includes(s.id));
  const total = selectedSlotData.reduce((sum, s) => sum + s.price, 0);

  if (selectedSlots.length === 0) {
    container.innerHTML = '<p class="text-center" style="opacity:0.7;">Select time slots to see booking summary</p>';
    return;
  }

  container.innerHTML = `
    <h3 style="margin-bottom:1.5rem;">Booking Summary</h3>
    <div style="margin-bottom:1rem;">
      <strong>Date:</strong> ${selectedDate}
    </div>
    <div style="margin-bottom:1rem;">
      <strong>Selected Slots:</strong>
      <ul style="list-style:none;margin-top:0.5rem;">
        ${selectedSlotData.map(s => `
          <li style="padding:0.25rem 0;display:flex;justify-content:space-between;">
            <span>${s.time}</span>
            <span>${formatPrice(s.price)}</span>
          </li>
        `).join('')}
      </ul>
    </div>
    <div style="border-top:1px solid var(--glass-border);padding-top:1rem;margin-bottom:1.5rem;font-size:1.2rem;font-weight:700;">
      <span>Total:</span>
      <span style="color:var(--accent-gold);float:right;">${formatPrice(total)}</span>
    </div>
    <div class="form-group">
      <label>Your Name *</label>
      <input type="text" id="customerName" placeholder="Enter your full name" required>
    </div>
    <div class="form-group">
      <label>Phone Number *</label>
      <input type="tel" id="customerPhone" placeholder="Enter your phone number" required>
    </div>
    <div class="form-group">
      <label>Email</label>
      <input type="email" id="customerEmail" placeholder="Enter your email (optional)">
    </div>
    <div class="form-group">
      <label>Team Name</label>
      <input type="text" id="teamName" placeholder="Enter your team name (optional)">
    </div>
    <div class="form-group">
      <label>Special Requests</label>
      <textarea id="specialRequests" rows="3" placeholder="Any special requests?"></textarea>
    </div>
    <button class="btn btn-primary" style="width:100%;" onclick="confirmBooking()">
      Confirm Booking
    </button>
  `;
}

function confirmBooking() {
  const name = document.getElementById('customerName')?.value.trim();
  const phone = document.getElementById('customerPhone')?.value.trim();

  if (!name || !phone) {
    showModal('Missing Information', 'Please fill in your name and phone number.');
    return;
  }

  if (selectedSlots.length === 0) {
    showModal('No Slots Selected', 'Please select at least one time slot.');
    return;
  }

  const bookings = getBookings();
  if (!bookings[selectedDate]) bookings[selectedDate] = [];

  // Check if any slot was booked in the meantime
  const slots = getSlots();
  const dayBookings = bookings[selectedDate];
  const blocked = getBlocked();
  const dayBlocked = blocked[selectedDate] || [];

  for (const slotId of selectedSlots) {
    if (dayBookings.includes(slotId) || dayBlocked.includes(slotId)) {
      showModal('Slot Unavailable', 'One or more selected slots are no longer available. Please refresh and try again.', 'location.reload()');
      return;
    }
  }

  // Add bookings
  bookings[selectedDate].push(...selectedSlots);
  saveBookings(bookings);

  // Generate reference
  const ref = 'HT-' + Date.now().toString(36).toUpperCase();

  // Store booking details
  const bookingDetails = JSON.parse(localStorage.getItem('hometurf_booking_details') || '[]');
  bookingDetails.push({
    ref: ref,
    date: selectedDate,
    slots: selectedSlots,
    name: name,
    phone: phone,
    email: document.getElementById('customerEmail')?.value || '',
    team: document.getElementById('teamName')?.value || '',
    requests: document.getElementById('specialRequests')?.value || '',
    timestamp: new Date().toISOString()
  });
  localStorage.setItem('hometurf_booking_details', JSON.stringify(bookingDetails));

  const total = selectedSlots.reduce((sum, id) => {
    const slot = slots.find(s => s.id === id);
    return sum + (slot ? slot.price : 0);
  }, 0);

  showModal(
    'Booking Confirmed!',
    `<div style="text-align:left;">
      <p><strong>Reference:</strong> ${ref}</p>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Date:</strong> ${selectedDate}</p>
      <p><strong>Total:</strong> ${formatPrice(total)}</p>
      <p style="margin-top:1rem;font-size:0.9rem;opacity:0.8;">Please save your reference number. Payment is due on arrival.</p>
    </div>`,
    'location.reload()'
  );
}

// Initialize booking page
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('bookingPage')) {
    initBooking();
  }
});
