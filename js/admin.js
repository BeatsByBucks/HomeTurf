
// ============================================
// HOMETURF 5-A-SIDE - Admin Dashboard
// ============================================

const ADMIN_USER = 'Admin';
const ADMIN_PASS = 'HomeTurf';

function initAdmin() {
  const admin = getAdmin();
  if (admin.loggedIn) {
    showDashboard();
  }
}

function login() {
  const username = document.getElementById('adminUser').value.trim();
  const password = document.getElementById('adminPass').value;

  if (username === ADMIN_USER && password === ADMIN_PASS) {
    saveAdmin({ loggedIn: true, loginTime: new Date().toISOString() });
    showDashboard();
  } else {
    showModal('Login Failed', 'Invalid username or password. Please try again.');
  }
}

function logout() {
  saveAdmin({ loggedIn: false });
  location.reload();
}

function showDashboard() {
  document.getElementById('loginSection').style.display = 'none';
  document.getElementById('dashboardSection').style.display = 'block';

  renderSlotsManager();
  renderBookingsList();
  renderBlockedSlots();
  renderStats();
}

// Slots Manager
function renderSlotsManager() {
  const container = document.getElementById('slotsManager');
  if (!container) return;

  const slots = getSlots();
  container.innerHTML = `
    <div style="margin-bottom:1.5rem;">
      <h4 style="margin-bottom:1rem;">Current Time Slots</h4>
      <div class="slot-list">
        ${slots.map(slot => `
          <div class="slot-item">
            <div>
              <strong>${slot.time}</strong>
              <span style="margin-left:1rem;color:var(--accent-gold);">${formatPrice(slot.price)}</span>
              ${slot.peak ? '<span style="margin-left:0.5rem;font-size:0.75rem;background:rgba(255,193,7,0.2);padding:0.15rem 0.5rem;border-radius:10px;">Peak</span>' : ''}
            </div>
            <div>
              <button class="btn-success" style="padding:0.4rem 0.8rem;margin-right:0.5rem;" onclick="editSlotPrice(${slot.id})">Edit Price</button>
              <button class="btn-danger" style="padding:0.4rem 0.8rem;" onclick="removeSlot(${slot.id})">Remove</button>
            </div>
          </div>
        `).join('')}
      </div>
    </div>

    <div style="border-top:1px solid var(--glass-border);padding-top:1.5rem;">
      <h4 style="margin-bottom:1rem;">Add New Slot</h4>
      <div style="display:grid;grid-template-columns:1fr 1fr auto auto;gap:0.75rem;align-items:end;">
        <div class="form-group" style="margin-bottom:0;">
          <label>Start Time</label>
          <input type="time" id="newSlotStart" required>
        </div>
        <div class="form-group" style="margin-bottom:0;">
          <label>End Time</label>
          <input type="time" id="newSlotEnd" required>
        </div>
        <div class="form-group" style="margin-bottom:0;">
          <label>Price (R)</label>
          <input type="number" id="newSlotPrice" placeholder="400" min="0" required>
        </div>
        <button class="btn btn-success" onclick="addSlot()" style="padding:0.75rem 1.5rem;">Add</button>
      </div>
      <label style="display:flex;align-items:center;gap:0.5rem;margin-top:0.75rem;cursor:pointer;">
        <input type="checkbox" id="newSlotPeak" style="width:auto;">
        <span>Peak Hour</span>
      </label>
    </div>
  `;
}

function editSlotPrice(slotId) {
  const slots = getSlots();
  const slot = slots.find(s => s.id === slotId);
  if (!slot) return;

  const newPrice = prompt(`Enter new price for ${slot.time}:`, slot.price);
  if (newPrice === null) return;

  const price = parseInt(newPrice);
  if (isNaN(price) || price < 0) {
    showModal('Invalid Price', 'Please enter a valid price.');
    return;
  }

  slot.price = price;
  saveSlots(slots);
  renderSlotsManager();
  showModal('Updated', 'Price updated successfully.');
}

function removeSlot(slotId) {
  if (!confirm('Are you sure you want to remove this time slot?')) return;

  let slots = getSlots();
  slots = slots.filter(s => s.id !== slotId);

  // Reassign IDs
  slots.forEach((s, i) => s.id = i + 1);

  saveSlots(slots);
  renderSlotsManager();
  showModal('Removed', 'Time slot removed successfully.');
}

function addSlot() {
  const start = document.getElementById('newSlotStart').value;
  const end = document.getElementById('newSlotEnd').value;
  const price = parseInt(document.getElementById('newSlotPrice').value);
  const peak = document.getElementById('newSlotPeak').checked;

  if (!start || !end || isNaN(price)) {
    showModal('Missing Info', 'Please fill in all fields.');
    return;
  }

  const slots = getSlots();
  const newId = slots.length > 0 ? Math.max(...slots.map(s => s.id)) + 1 : 1;

  slots.push({
    id: newId,
    time: `${start} - ${end}`,
    price: price,
    peak: peak
  });

  // Sort by time
  slots.sort((a, b) => a.time.localeCompare(b.time));

  saveSlots(slots);
  renderSlotsManager();

  // Clear inputs
  document.getElementById('newSlotStart').value = '';
  document.getElementById('newSlotEnd').value = '';
  document.getElementById('newSlotPrice').value = '';
  document.getElementById('newSlotPeak').checked = false;

  showModal('Added', 'New time slot added successfully.');
}

// Block Slots
function renderBlockedSlots() {
  const container = document.getElementById('blockedSlotsManager');
  if (!container) return;

  const blocked = getBlocked();
  const slots = getSlots();
  const days = getNext7Days();

  container.innerHTML = `
    <div style="margin-bottom:1rem;">
      <label style="display:block;margin-bottom:0.5rem;font-weight:600;">Select Date</label>
      <select id="blockDateSelect" onchange="renderBlockSlotList()" style="width:100%;padding:0.75rem;">
        ${days.map(d => `<option value="${d.key}">${d.key} (${d.dayName})</option>`).join('')}
      </select>
    </div>
    <div id="blockSlotList" style="margin-top:1rem;"></div>
  `;

  renderBlockSlotList();
}

function renderBlockSlotList() {
  const dateSelect = document.getElementById('blockDateSelect');
  const container = document.getElementById('blockSlotList');
  if (!dateSelect || !container) return;

  const dateKey = dateSelect.value;
  const slots = getSlots();
  const blocked = getBlocked();
  const bookings = getBookings();

  const dayBlocked = blocked[dateKey] || [];
  const dayBookings = bookings[dateKey] || [];

  container.innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(130px, 1fr));gap:0.75rem;">
      ${slots.map(slot => {
        const isBlocked = dayBlocked.includes(slot.id);
        const isBooked = dayBookings.includes(slot.id);
        return `
          <div style="padding:0.75rem;background:${isBlocked ? 'rgba(220,53,69,0.2)' : isBooked ? 'rgba(108,117,125,0.2)' : 'rgba(255,255,255,0.05)'};border:2px solid ${isBlocked ? '#dc3545' : isBooked ? '#6c757d' : 'var(--glass-border)'};border-radius:10px;text-align:center;cursor:${isBooked ? 'not-allowed' : 'pointer'};opacity:${isBooked ? 0.5 : 1};" 
               onclick="${isBooked ? '' : `toggleBlock('${dateKey}', ${slot.id})`}">
            <div style="font-weight:700;font-size:0.95rem;">${slot.time}</div>
            <div style="font-size:0.8rem;margin-top:0.25rem;">
              ${isBlocked ? '<span style="color:#dc3545;">Blocked</span>' : isBooked ? '<span style="color:#6c757d;">Booked</span>' : '<span style="color:#28a745;">Available</span>'}
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function toggleBlock(dateKey, slotId) {
  const blocked = getBlocked();
  if (!blocked[dateKey]) blocked[dateKey] = [];

  const index = blocked[dateKey].indexOf(slotId);
  if (index > -1) {
    blocked[dateKey].splice(index, 1);
  } else {
    blocked[dateKey].push(slotId);
  }

  saveBlocked(blocked);
  renderBlockSlotList();
}

// Bookings List
function renderBookingsList() {
  const container = document.getElementById('bookingsList');
  if (!container) return;

  const bookings = getBookings();
  const bookingDetails = JSON.parse(localStorage.getItem('hometurf_booking_details') || '[]');
  const slots = getSlots();

  if (bookingDetails.length === 0) {
    container.innerHTML = '<p style="text-align:center;opacity:0.7;padding:2rem;">No bookings yet.</p>';
    return;
  }

  // Sort by date, newest first
  const sorted = [...bookingDetails].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  container.innerHTML = `
    <div class="slot-list">
      ${sorted.map(booking => {
        const slotInfo = booking.slots.map(id => {
          const slot = slots.find(s => s.id === id);
          return slot ? slot.time : 'Unknown';
        }).join(', ');

        const total = booking.slots.reduce((sum, id) => {
          const slot = slots.find(s => s.id === id);
          return sum + (slot ? slot.price : 0);
        }, 0);

        return `
          <div class="slot-item" style="flex-direction:column;align-items:flex-start;gap:0.5rem;">
            <div style="display:flex;justify-content:space-between;width:100%;align-items:center;">
              <strong style="color:var(--accent-gold);">${booking.ref}</strong>
              <span style="font-size:0.85rem;opacity:0.7;">${new Date(booking.timestamp).toLocaleString()}</span>
            </div>
            <div><strong>Name:</strong> ${booking.name}</div>
            <div><strong>Phone:</strong> ${booking.phone}</div>
            <div><strong>Date:</strong> ${booking.date}</div>
            <div><strong>Slots:</strong> ${slotInfo}</div>
            <div><strong>Total:</strong> ${formatPrice(total)}</div>
            ${booking.team ? `<div><strong>Team:</strong> ${booking.team}</div>` : ''}
            ${booking.requests ? `<div><strong>Requests:</strong> ${booking.requests}</div>` : ''}
          </div>
        `;
      }).join('')}
    </div>
  `;
}

// Stats
function renderStats() {
  const container = document.getElementById('statsPanel');
  if (!container) return;

  const bookings = getBookings();
  const bookingDetails = JSON.parse(localStorage.getItem('hometurf_booking_details') || '[]');
  const slots = getSlots();

  const totalBookings = bookingDetails.length;
  const totalRevenue = bookingDetails.reduce((sum, b) => {
    return sum + b.slots.reduce((s, id) => {
      const slot = slots.find(sl => sl.id === id);
      return s + (slot ? slot.price : 0);
    }, 0);
  }, 0);

  const today = getDateKey(new Date());
  const todayBookings = bookings[today] ? bookings[today].length : 0;

  container.innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(150px, 1fr));gap:1rem;">
      <div style="text-align:center;padding:1.5rem;background:rgba(255,255,255,0.05);border-radius:15px;">
        <div style="font-size:2rem;font-weight:800;color:var(--accent-gold);">${totalBookings}</div>
        <div style="font-size:0.9rem;opacity:0.8;margin-top:0.5rem;">Total Bookings</div>
      </div>
      <div style="text-align:center;padding:1.5rem;background:rgba(255,255,255,0.05);border-radius:15px;">
        <div style="font-size:2rem;font-weight:800;color:var(--accent-gold);">${formatPrice(totalRevenue)}</div>
        <div style="font-size:0.9rem;opacity:0.8;margin-top:0.5rem;">Total Revenue</div>
      </div>
      <div style="text-align:center;padding:1.5rem;background:rgba(255,255,255,0.05);border-radius:15px;">
        <div style="font-size:2rem;font-weight:800;color:var(--accent-gold);">${todayBookings}</div>
        <div style="font-size:0.9rem;opacity:0.8;margin-top:0.5rem;">Today's Bookings</div>
      </div>
      <div style="text-align:center;padding:1.5rem;background:rgba(255,255,255,0.05);border-radius:15px;">
        <div style="font-size:2rem;font-weight:800;color:var(--accent-gold);">${slots.length}</div>
        <div style="font-size:0.9rem;opacity:0.8;margin-top:0.5rem;">Time Slots</div>
      </div>
    </div>
  `;
}

// Reset all data
function resetAllData() {
  if (!confirm('WARNING: This will delete ALL bookings and reset all settings. Are you sure?')) return;
  if (!confirm('Are you absolutely sure? This cannot be undone.')) return;

  localStorage.removeItem('hometurf_slots');
  localStorage.removeItem('hometurf_bookings');
  localStorage.removeItem('hometurf_blocked');
  localStorage.removeItem('hometurf_booking_details');

  initData();
  renderSlotsManager();
  renderBookingsList();
  renderBlockedSlots();
  renderStats();

  showModal('Reset Complete', 'All data has been reset to defaults.');
}

// Initialize admin page
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('adminPage')) {
    initAdmin();
  }
});
