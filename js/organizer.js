import { populateVenueOptions } from './ui.js';
import { initEventManagementModule, renderOrganizerEventManagementUI } from './eventManagement.js'; // Import event management
import { renderVerificationUI } from './verification.js';

let mainContentRef;
let appDataRef;
let uiHelpersRef;
let saveDataCallbackRef;
// No getCurrentUserCallback needed for organizer as it doesn't directly use currentUser for now

export function initOrganizerModule(mainContentElement, data, ui, saveDataFunc, getCurrentUserFunc) { // Added getCurrentUserFunc
    mainContentRef = mainContentElement;
    appDataRef = data; // { venues, concerts, tickets }
    uiHelpersRef = ui; // { populateVenueOptions, createModal, removeModal }
    saveDataCallbackRef = saveDataFunc;

    // Initialize event management for organizer
    initEventManagementModule(
        { venues: appDataRef.venues, concerts: appDataRef.concerts },
        uiHelpersRef, // Pass the entire uiHelpersRef object
        saveDataCallbackRef,
        getCurrentUserFunc // Pass getCurrentUserFunc for organizerId
    );
}

export function renderOrganizerDashboardUI() {
    if (!mainContentRef || !appDataRef || !uiHelpersRef || !saveDataCallbackRef) {
        console.error("Organizer module not initialized correctly.");
        mainContentRef.innerHTML = "<p>主辦方模組載入失敗，請稍後再試。</p>";
        return;
    }
    mainContentRef.innerHTML = `
    <h2>主辦方控制台</h2>
    <nav style="margin-bottom: 1rem;">
      <button id="orgTicketsBtn">票務管理</button>
      <button id="orgAccountingBtn">帳務管理</button>
      <button id="orgVerifyBtn">票券驗證</button>
    </nav>
    <section id="organizerContent"></section>
    `;
    const organizerContentElement = mainContentRef.querySelector('#organizerContent');

    document.getElementById('orgTicketsBtn').onclick = () => {
        if (organizerContentElement) {
            renderOrganizerEventManagementUI(organizerContentElement);
        } else {
            console.error("Organizer content element not found for orgTicketsBtn");
        }
    };
    document.getElementById('orgAccountingBtn').onclick = () => renderOrgAccounting();
    document.getElementById('orgVerifyBtn').onclick = () => {
        if (organizerContentElement) {
            renderVerificationUI(organizerContentElement);
        }
    };

    // Default show tickets (now handled by event management)
    if (organizerContentElement) {
        renderOrganizerEventManagementUI(organizerContentElement);
    } else {
        console.error("Organizer content element not found for default render");
    }
}

// Organizer accounting - similar to admin accounting but no edit
function renderOrgAccounting() {
    const { concerts } = appDataRef; // Destructure from appDataRef
    const organizerContent = mainContentRef.querySelector('#organizerContent');
    if (!organizerContent) {
        console.error("Organizer content container not found for accounting");
        return;
    }
    organizerContent.innerHTML = `<h3>帳務管理</h3>
      <table style="width:100%; border-collapse: collapse;" border="1" cellpadding="5" cellspacing="0">
        <thead>
          <tr style="background: var(--primary-color); color:white;">
            <th>演唱會</th>
            <th>票價 (NT$)</th>
            <th>已售票數</th>
            <th>收入 (NT$)</th>
          </tr>
        </thead>
        <tbody id="orgAccountingBody"></tbody>
        <tfoot style="font-weight:bold;">
          <tr>
            <td colspan="3" style="text-align:right;">總收入：</td>
            <td id="orgTotalRevenue">NT$0</td>
          </tr>
        </tfoot>
      </table>`;
    const tbody = document.getElementById('orgAccountingBody');
    tbody.innerHTML = '';
    let total = 0;
    // Filter concerts by organizer if needed in future
    concerts.forEach(c => {
        const revenue = c.ticketsSold * c.price;
        total += revenue;
        const tr = document.createElement('tr');
        tr.innerHTML = `
        <td>${c.title}</td>
        <td>${c.price}</td>
        <td>${c.ticketsSold}</td>
        <td>${revenue}</td>
      `;
        tbody.appendChild(tr);
    });
    document.getElementById('orgTotalRevenue').textContent = `NT$${total}`;
}
