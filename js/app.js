import { fetchFromDB, saveToDB } from './db.js';
import { STORAGE_KEYS, users, venues, concerts, tickets } from './data.js';
import { roleNameDisplay, createModal, removeModal, populateVenueOptions } from './ui.js';
import { initAuth, renderLogin as authRenderLogin, renderForgotPassword as authRenderForgotPassword, renderRegister as authRenderRegister, renderRoleSelection as authRenderRoleSelection, renderAccountSettings as authRenderAccountSettings } from './auth.js';
import { initAdminModule, renderAdminDashboardUI } from './admin.js';
import { initOrganizerModule, renderOrganizerDashboardUI } from './organizer.js';
import { initUserModule, renderSpectatorDashboardUI } from './user.js';
import { initTicketingModule } from './ticketing.js';
import { initRefundModule } from './refund.js';
import { initPaymentModule } from './payment.js'; // Import payment module

// Current logged in user and selected role
let currentUser = null;
let currentRole = null;

const app = document.getElementById('app');
const mainContent = document.getElementById('mainContent');
const logoutBtn = document.getElementById('logoutBtn');
const switchRoleBtn = document.getElementById('switchRoleBtn'); // Get the switch role button
const accountSettingsBtn = document.getElementById('accountSettingsBtn'); // Get the account settings button

// --- Helper functions for auth module ---
function setCurrentUser(user) {
  currentUser = user;
}
function setCurrentRole(role) {
  currentRole = role;
}
function getCurrentUser() { // Renamed for clarity and broader use
  return currentUser;
}
// --- End Helper functions for auth module ---


// Utility: save/load data.
async function saveData() {
  await saveToDB(STORAGE_KEYS.VENUES, venues);
  await saveToDB(STORAGE_KEYS.CONCERTS, concerts);
  await saveToDB(STORAGE_KEYS.TICKETS, tickets);
  // Note: users data is not persisted to localStorage in this version
}
async function loadData() {
  const savedVenues = await fetchFromDB(STORAGE_KEYS.VENUES);
  if (savedVenues) venues.splice(0, venues.length, ...savedVenues);

  const savedConcerts = await fetchFromDB(STORAGE_KEYS.CONCERTS);
  if (savedConcerts) concerts.splice(0, concerts.length, ...savedConcerts);

  const savedTickets = await fetchFromDB(STORAGE_KEYS.TICKETS);
  if (savedTickets) tickets.splice(0, tickets.length, ...savedTickets);
}

// Save login & role to localStorage
function saveLoginState() {
  localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(currentUser));
  localStorage.setItem(STORAGE_KEYS.CURRENT_ROLE, currentRole);
}
// Load login & role
function loadLoginState() {
  const savedUser = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
  if (savedUser) currentUser = JSON.parse(savedUser);
  const savedRole = localStorage.getItem(STORAGE_KEYS.CURRENT_ROLE);
  if (savedRole) currentRole = savedRole;
}
// Clear login state
function clearLoginState() {
  localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  localStorage.removeItem(STORAGE_KEYS.CURRENT_ROLE);
  currentUser = null;
  currentRole = null;
}

// Render login form (username + password) - Now handled by auth.js
// function renderLogin() { ... removed ... }

// 忘記密碼流程 - Now handled by auth.js
// function renderForgotPassword() { ... removed ... }

// 新增：註冊表單 - Now handled by auth.js
// function renderRegister() { ... removed ... }

// Role selection UI after login if multiple roles - Now handled by auth.js
// function renderRoleSelection() { ... removed ... }

// function roleNameDisplay(role){ ... moved to ui.js ... }

// Render public home page with concert carousel
function renderHomePage() {
  logoutBtn.style.display = 'none';
  switchRoleBtn.style.display = 'none';
  accountSettingsBtn.style.display = 'none';

  const carouselSlides = concerts.map(c => {
    const venue = venues.find(v => v.id === c.venueId);
    const firstSession = c.sessions && c.sessions[0];
    const dateStr = firstSession ? new Date(firstSession.dateTime).toLocaleDateString() : '';
    const location = venue ? venue.name : '';
    return `
      <div class="carousel-slide">
        <img src="${c.imageUrl}" alt="${c.title}">
        <div class="slide-info">
          <h3>${c.title}</h3>
          <p>${dateStr} ${location}</p>
        </div>
      </div>`;
  }).join('');

  mainContent.innerHTML = `
    <div class="home-carousel full-bg-carousel">
      <div class="carousel-slides" id="carouselSlides">
        ${carouselSlides}
      </div>
      <button id="homeLoginBtn" class="home-login-btn overlay-login-btn">立即登入</button>
    </div>
  `;

  const slides = Array.from(document.querySelectorAll('.carousel-slide'));
  let slideIndex = 0;
  if (slides.length) {
    slides[0].classList.add('active');
    setInterval(() => {
      slides[slideIndex].classList.remove('active');
      slideIndex = (slideIndex + 1) % slides.length;
      slides[slideIndex].classList.add('active');
    }, 4000);
  }

  document.getElementById('homeLoginBtn').onclick = () => authRenderLogin();
}

// Render dashboard based on role
function renderDashboard() {
  if(!currentUser || !currentRole){
    authRenderLogin(); // Call the login page from auth module
    logoutBtn.style.display = 'none'; 
    switchRoleBtn.style.display = 'none'; // Hide switch role button when not logged in
    accountSettingsBtn.style.display = 'none'; // Hide account settings button when not logged in
    if (document.getElementById('currentUserDisplay')) {
      document.getElementById('currentUserDisplay').textContent = ''; // Clear user display
    }
    return;
  }
  logoutBtn.style.display = 'block'; // Show logout when logged in
  accountSettingsBtn.style.display = 'block'; // Show account settings button when logged in
  // Show switch role button only if user has multiple roles
  switchRoleBtn.style.display = currentUser && currentUser.roles && currentUser.roles.length > 1 ? 'block' : 'none';
  if (document.getElementById('currentUserDisplay')) {
    document.getElementById('currentUserDisplay').textContent = `使用者: ${currentUser.username} (${roleNameDisplay(currentRole)})`;
  }

  switch(currentRole){
    case 'admin':
      renderAdminDashboardUI();
      break;
    case 'organizer':
      renderOrganizerDashboardUI();
      break;
    case 'spectator':
      // renderSpectatorDashboard(); // Replaced by user module
      renderSpectatorDashboardUI();
      break;
    default:
      mainContent.innerHTML = `<p>未知角色：${currentRole}</p>`;
  }
}

  // ------------------ Admin dashboard ----------------------
  // All admin functions are now in js/admin.js

  // ------------------ Organizer dashboard ----------------------
  // All organizer functions are now in js/organizer.js

  // ------------------ Spectator dashboard ----------------------
  // All spectator functions (renderSpectatorDashboard, renderConcertsForSpectator, 
  // renderMyTickets, showBuyTicketModal, showRefundModal) are now moved to js/user.js
  // function renderSpectatorDashboard(){ ... moved to user.js ... }
  // function renderConcertsForSpectator(){ ... moved to user.js ... }
  // function renderMyTickets(){ ... moved to user.js ... }
  // function showBuyTicketModal(concert){ ... moved to user.js ... }
  // function showRefundModal(ticket, concert){ ... moved to user.js ... }

  // Admin refund review - This function is specific to Admin, so it stays in app.js or moves to admin.js
  // For now, assuming it might be called from admin module, or it is a shared utility.
  // Let's move it to admin.js for better organization if it's purely an admin task.
  // If it's used by other modules, it might need a different approach.
  // For now, keeping it here and will address if it causes issues or is clearly admin-only.
  // UPDATE: renderRefundReview was already moved to admin.js. This comment is now for historical context.
  // The function was part of the admin dashboard logic.

  // Logout handler
  logoutBtn.addEventListener('click', () => {
    if(confirm('確定要登出嗎？')){
      clearLoginState();
      switchRoleBtn.style.display = 'none'; // Hide switch role button on logout
      accountSettingsBtn.style.display = 'none'; // Hide account settings button on logout
      renderDashboard(); 
    }
  });

  // Add event listener for the account settings button
  accountSettingsBtn.addEventListener('click', () => {
    // 直接呼叫已引入的 authRenderAccountSettings
    authRenderAccountSettings();
    logoutBtn.style.display = 'none';
    switchRoleBtn.style.display = 'none';
    accountSettingsBtn.style.display = 'none'; // Hide itself when on account settings page
  });

  // Add event listener for the switch role button
  switchRoleBtn.addEventListener('click', () => {
      if (currentUser && currentUser.roles.length > 1) {
          // Call a function in auth.js to render role selection
          // This function should ideally be exported from auth.js
          // For now, let's assume auth.js has a function like `authRenderRoleSelection`
          authRenderRoleSelection(currentUser); 
          logoutBtn.style.display = 'none'; // Hide logout during role selection
          switchRoleBtn.style.display = 'none'; // Hide switch role itself during selection
      } else {
          // This case should not happen if button is managed correctly
          console.warn("Switch role button clicked inappropriately.");
      }
  });

  // Function to update general UI elements based on login state
  function updateLoginRelatedUI() {
      if (currentUser && currentRole) {
          logoutBtn.style.display = 'block';
          switchRoleBtn.style.display = currentUser.roles.length > 1 ? 'block' : 'none';
          accountSettingsBtn.style.display = 'block'; // Ensure it's shown when logged in
          if (document.getElementById('currentUserDisplay')) {
              document.getElementById('currentUserDisplay').textContent = `使用者: ${currentUser.username} (${roleNameDisplay(currentRole)})`;
          }
      } else {
          logoutBtn.style.display = 'none';
          switchRoleBtn.style.display = 'none';
          accountSettingsBtn.style.display = 'none'; // Ensure it's hidden when not logged in
          if (document.getElementById('currentUserDisplay')) {
              document.getElementById('currentUserDisplay').textContent = '';
          }
      }
  }

    // Initialization entry point
    export async function initApp() {
      await loadData(); // Load data first
      loadLoginState(); // Load login state after data is potentially available

      // Initialize Auth module first, as other modules might depend on user state
      initAuth(
        mainContent, // Pass mainContent DOM element
        logoutBtn,   // Pass logoutBtn DOM element
        switchRoleBtn, // Pass switchRoleBtn DOM element
        accountSettingsBtn, // Pass accountSettingsBtn DOM element
        setCurrentUser,
        setCurrentRole,
        saveLoginState,
        loadData, // Pass the loadData function from app.js
        renderDashboard,
        getCurrentUser, // Pass the actual function
        updateLoginRelatedUI // Pass the UI update function
      );

      // Initialize other modules that depend on auth or appData
      // Pass appData and necessary callbacks to other modules
      const appData = { users, venues, concerts, tickets };

      // Ensure getCurrentUser is correctly passed to initTicketingModule
      initTicketingModule(appData, saveData, getCurrentUser, () => {
        renderDashboard(); // Refresh dashboard after purchase
        // Potentially also refresh user-specific views like "My Tickets"
        if (currentRole === 'spectator') {
          renderSpectatorDashboardUI(); // Or a more specific update function
        }
      });

      // Define common UI helpers
      const commonUiHelpers = { roleNameDisplay, createModal, removeModal, populateVenueOptions };

      // Corrected call to initAdminModule:
      initAdminModule(mainContent, appData, commonUiHelpers, saveData, getCurrentUser);

      // initOrganizerModule(appData, saveData, renderDashboard, getCurrentUser); // OLD PROBLEMATIC CALL
      // Corrected call to initOrganizerModule:
      initOrganizerModule(
        mainContent,      // 1. mainContentElement
        appData,          // 2. data
        commonUiHelpers,  // 3. ui
        saveData,         // 4. saveDataFunc
        getCurrentUser    // 5. getCurrentUserFunc
      );

      // initUserModule(appData, saveData, getCurrentUser, tickets, concerts, venues, renderDashboard); // Pass getCurrentUser
      // Corrected call to initUserModule:
      initUserModule(mainContent, appData, saveData, getCurrentUser);

      // initRefundModule(appData, saveData, getCurrentUser); // Pass getCurrentUser
      // Corrected call to initRefundModule:
      initRefundModule(appData, saveData, getCurrentUser, renderDashboard); // Pass renderDashboard as UI update callback

      // initPaymentModule(appData, saveData, getCurrentUser);
      // Corrected call to initPaymentModule:
      initPaymentModule(appData, saveData, getCurrentUser);

      if (currentUser && currentRole) {
        renderDashboard();
        updateLoginRelatedUI();
      } else {
        renderHomePage();
      }
    }
