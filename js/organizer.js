import { populateVenueOptions } from './ui.js';
import { initEventManagementModule, renderOrganizerEventManagementUI } from './eventManagement.js'; // Import event management
import { renderVerificationUI } from './verification.js';

let mainContentRef;
let appDataRef;
let uiHelpersRef;
let saveDataCallbackRef;
let organizerGetCurrentUserCallback = null;
// No getCurrentUserCallback needed for organizer as it doesn't directly use currentUser for now

export function initOrganizerModule(mainContentElement, data, ui, saveDataFunc, getCurrentUserFunc) { // Added getCurrentUserFunc
    mainContentRef = mainContentElement;
    appDataRef = data; // { venues, concerts, tickets }
    uiHelpersRef = ui; // { populateVenueOptions, createModal, removeModal }
    saveDataCallbackRef = saveDataFunc;
    organizerGetCurrentUserCallback = getCurrentUserFunc;

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
      <button id="orgRefundBtn">退票審核</button>
      <button id="orgGrantBtn">發送公關票</button>
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
    document.getElementById('orgRefundBtn').onclick = () => {
        if (organizerContentElement) {
            renderOrganizerRefundReviewUI(organizerContentElement);
        }
    };
    document.getElementById('orgGrantBtn').onclick = () => {
        if (organizerContentElement) {
            renderGrantPRTicketUI(organizerContentElement);
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
    const { concerts, tickets } = appDataRef;
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
            <th>公關票數</th>
            <th>收入 (NT$)</th>
          </tr>
        </thead>
        <tbody id="orgAccountingBody"></tbody>
        <tfoot style="font-weight:bold;">
          <tr>
            <td colspan="4" style="text-align:right;">總收入：</td>
            <td id="orgTotalRevenue">NT$0</td>
          </tr>
        </tfoot>
      </table>`;
    const tbody = document.getElementById('orgAccountingBody');
    tbody.innerHTML = '';
    let total = 0;
    let currentUser = null;
    if (typeof organizerGetCurrentUserCallback === 'function') {
        currentUser = organizerGetCurrentUserCallback();
    } else if (window.getCurrentUser) {
        currentUser = window.getCurrentUser();
    }
    const myConcerts = concerts.filter(c => String(c.organizerId) === String(currentUser && currentUser.username));
    myConcerts.forEach(concert => {
        let concertTotal = 0;
        let concertSold = 0;
        let concertPR = 0;
        let priceList = [];
        concert.sessions.forEach(session => {
            session.sections.forEach(section => {
                // 有效票券
                const validTickets = tickets.filter(t =>
                    String(t.concertId) === String(concert.id) &&
                    String(t.sessionId) === String(session.sessionId) &&
                    String(t.sectionId) === String(section.sectionId) &&
                    (t.status === 'confirmed' || t.status === 'used' || t.paymentMethod === 'pr')
                );
                // 公關票
                const prTickets = validTickets.filter(t => t.paymentMethod === 'pr');
                // 一般票
                const normalTickets = validTickets.filter(t => t.paymentMethod !== 'pr');
                const sold = normalTickets.length;
                const prCount = prTickets.length;
                concertSold += sold;
                concertPR += prCount;
                concertTotal += sold * (section.price || 0);
                if (sold > 0 || prCount > 0) priceList.push(section.price);
            });
        });
        const priceStr = priceList.length > 0 ? priceList.join(', ') : '-';
        const tr = document.createElement('tr');
        tr.innerHTML = `
        <td>${concert.title}</td>
        <td>${priceStr}</td>
        <td>${concertSold}</td>
        <td>${concertPR}</td>
        <td>${concertTotal}</td>
      `;
        tbody.appendChild(tr);
        total += concertTotal;
    });
    document.getElementById('orgTotalRevenue').textContent = `NT$${total}`;
}

// Organizer審查退票（僅顯示自己主辦活動的票）
function renderOrganizerRefundReviewUI(containerElement) {
    containerElement.innerHTML = `
    <h3>退票審核</h3>
    <ul class="tickets-list" id="refundListOrg"></ul>
    `;
    const ul = containerElement.querySelector('#refundListOrg');
    ul.innerHTML = '';
    // 只顯示自己主辦活動的退票
    const currentUser = (window.getCurrentUser && window.getCurrentUser()) || (typeof getCurrentUserCallback === 'function' && getCurrentUserCallback());
    const myConcertIds = appDataRef.concerts.filter(c => c.organizerId === currentUser.username).map(c => c.id);
    const pendingRefunds = appDataRef.tickets.filter(t => t.status === 'refund_pending' && myConcertIds.includes(t.concertId));
    if (pendingRefunds.length === 0) {
        ul.innerHTML = '<li>目前無待審核的退票申請。</li>';
        return;
    }
    pendingRefunds.forEach(t => {
        const concert = appDataRef.concerts.find(c => c.id === t.concertId);
        const li = document.createElement('li');
        li.innerHTML = `
        <div style="flex-grow:1;">
          <strong>${concert.title}</strong><br/>
          申請人: ${t.username}
        </div>
      `;
        const approveBtn = document.createElement('button');
        approveBtn.className = 'small-btn';
        approveBtn.textContent = '同意';
        approveBtn.onclick = () => {
            t.status = 'refunded';
            saveDataCallbackRef();
            renderOrganizerRefundReviewUI(containerElement);
        };
        const rejectBtn = document.createElement('button');
        rejectBtn.className = 'small-btn';
        rejectBtn.style.background = '#888';
        rejectBtn.textContent = '拒絕';
        rejectBtn.onclick = () => {
            t.status = 'normal';
            saveDataCallbackRef();
            renderOrganizerRefundReviewUI(containerElement);
        };
        li.appendChild(approveBtn);
        li.appendChild(rejectBtn);
        ul.appendChild(li);
    });
}

// Organizer發送公關票
function renderGrantPRTicketUI(containerElement) {
    containerElement.innerHTML = `
    <h3>發送公關票</h3>
    <div style="margin-bottom:1rem;">
      <input type="text" id="prTargetUser" placeholder="輸入對方帳號" style="margin-right:0.5rem;">
      <select id="prConcert"></select>
      <select id="prSession"></select>
      <select id="prSection"></select>
      <button id="grantPRBtn">發送</button>
    </div>
    <div id="prGrantResult"></div>
    `;
    // 動態填入主辦方的活動、場次、區域
    let currentUser = null;
    if (typeof organizerGetCurrentUserCallback === 'function') {
        currentUser = organizerGetCurrentUserCallback();
    } else if (window.getCurrentUser) {
        currentUser = window.getCurrentUser();
    }
    // debug log
    console.log('currentUser', currentUser);
    // organizerId 比對強制轉字串
    const myConcerts = appDataRef.concerts.filter(c => String(c.organizerId) === String(currentUser && currentUser.username));
    console.log('myConcerts', myConcerts);
    const concertSel = containerElement.querySelector('#prConcert');
    const sessionSel = containerElement.querySelector('#prSession');
    const sectionSel = containerElement.querySelector('#prSection');
    concertSel.innerHTML = '';
    sessionSel.innerHTML = '';
    sectionSel.innerHTML = '';
    if (myConcerts.length === 0) {
        concertSel.innerHTML = '<option value="">無可發送公關票的活動</option>';
        sessionSel.innerHTML = '<option value="">—</option>';
        sectionSel.innerHTML = '<option value="">—</option>';
        document.getElementById('prGrantResult').textContent = '目前無可發送公關票的活動';
        return;
    }
    myConcerts.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.id;
        opt.textContent = c.title;
        concertSel.appendChild(opt);
    });
    function updateSessionsAndSections() {
        sessionSel.innerHTML = '';
        sectionSel.innerHTML = '';
        const concert = myConcerts.find(c => c.id == concertSel.value);
        if (!concert) return;
        concert.sessions.forEach(s => {
            const opt = document.createElement('option');
            opt.value = s.sessionId;
            opt.textContent = new Date(s.dateTime).toLocaleString();
            sessionSel.appendChild(opt);
        });
        let session = null;
        if (concert.sessions.length > 0) {
            session = concert.sessions.find(s => s.sessionId == sessionSel.value);
            if (!session) session = concert.sessions[0];
        }
        if (session && session.sections) {
            session.sections.forEach(sec => {
                const opt = document.createElement('option');
                opt.value = sec.sectionId;
                opt.textContent = sec.sectionId;
                sectionSel.appendChild(opt);
            });
        }
    }
    concertSel.onchange = updateSessionsAndSections;
    sessionSel.onchange = updateSessionsAndSections;
    concertSel.value = myConcerts[0].id;
    updateSessionsAndSections();
    containerElement.querySelector('#grantPRBtn').onclick = () => {
        const username = containerElement.querySelector('#prTargetUser').value.trim();
        const concertId = concertSel.value;
        const sessionId = sessionSel.value;
        const sectionId = sectionSel.value;
        const user = appDataRef.users.find(u => u.username === username);
        const resultDiv = document.getElementById('prGrantResult');
        if (!user) {
            resultDiv.textContent = '帳號不存在';
            return;
        }
        if (!concertId || !sessionId || !sectionId) {
            resultDiv.textContent = '請選擇活動、場次與區域';
            return;
        }
        // 建立公關票
        const ticketId = 'PR' + Date.now() + '-' + username + '-' + Math.random().toString(36).substr(2, 5);
        appDataRef.tickets.push({
            ticketId,
            username,
            concertId: Number(concertId),
            sessionId,
            sectionId,
            purchaseTime: new Date().toISOString(),
            paymentMethod: 'pr',
            status: 'confirmed',
            seats: [],
            totalPrice: 0
        });
        saveDataCallbackRef();
        resultDiv.textContent = '公關票已發送';
    };
}
