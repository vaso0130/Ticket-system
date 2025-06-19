// Event Management Module
// let mainContentElement; // REMOVED: This was the source of the issue if overwritten

// Use em_ prefix for module-specific variables to avoid naming collisions and clarify scope
let em_appData;
let em_uiHelpers;
let em_saveDataCallback;
let em_getCurrentUserCallback;

// 1. initEventManagementModule: Removed contentEl parameter.
export function initEventManagementModule(data, ui, saveDataFn, getCurrentUserFn) {
    em_appData = data;
    em_uiHelpers = ui;
    em_saveDataCallback = saveDataFn;
    em_getCurrentUserCallback = getCurrentUserFn;
    // === 新增：補齊所有現有場次的預設票券 ===
    if (!em_appData.tickets) em_appData.tickets = [];
    em_appData.concerts.forEach(event => {
        event.sessions.forEach(session => {
            session.sections.forEach(section => {
                // 計算目前已存在的預設票數
                const existCount = em_appData.tickets.filter(t =>
                    String(t.concertId) === String(event.id) &&
                    String(t.sessionId) === String(session.sessionId) &&
                    String(t.sectionId) === String(section.sectionId) &&
                    t.status === 'normal' && !t.username
                ).length;
                // 需要補齊的數量
                const need = section.ticketsAvailable - existCount;
                for (let i = 0; i < need; i++) {
                    em_appData.tickets.push({
                        ticketId: `T${Date.now()}-${event.id}-${session.sessionId}-${section.sectionId}-${i}-${Math.random().toString(36).substr(2,5)}`,
                        username: null,
                        concertId: event.id,
                        sessionId: session.sessionId,
                        sectionId: section.sectionId,
                        purchaseTime: null,
                        paymentMethod: null,
                        status: 'normal',
                        seats: [],
                        totalPrice: section.price
                    });
                }
            });
        });
    });
}

// === 輔助函式：數字轉字母（1→A, 2→B, ...） ===
function rowNumberToLetter(n) {
    let s = '';
    while (n > 0) {
        n--;
        s = String.fromCharCode(65 + (n % 26)) + s;
        n = Math.floor(n / 26);
    }
    return s;
}

// === 高效重建所有可販售票券 ===
export function fixAllSessionsTickets(appData) {
    if (!appData.tickets) appData.tickets = [];

    // 1. 分離已售出/預訂的票券與需重新計算的'normal'票券
    const nonNormalTickets = appData.tickets.filter(t => t.status !== 'normal');
    const newNormalTickets = [];

    appData.concerts.forEach(event => {
        event.sessions.forEach(session => {
            session.sections.forEach(section => {
                const venue = appData.venues.find(v => v.id === event.venueId);
                const venueSection = venue ? venue.seatMap.find(s => s.id === section.sectionId) : null;

                // 篩選出此特定區域已售出/預訂的票券
                const soldTicketsInSection = nonNormalTickets.filter(t =>
                    String(t.concertId) === String(event.id) &&
                    String(t.sessionId) === String(session.sessionId) &&
                    String(t.sectionId) === String(section.sectionId)
                );

                if (venueSection && venueSection.seatingType === 'numbered' && venueSection.rows && venueSection.seatsPerRow) {
                    // 對號座：根據已售出的座位，產生剩餘座位的票券
                    const soldSeats = soldTicketsInSection.flatMap(t => t.seats || []);

                    for (let r = 1; r <= venueSection.rows; r++) {
                        const rowLabel = rowNumberToLetter(r);
                        for (let s = 1; s <= venueSection.seatsPerRow; s++) {
                            const isSold = soldSeats.some(soldSeat => soldSeat.row === r && soldSeat.seat === s);
                            if (!isSold) {
                                newNormalTickets.push({
                                    ticketId: `T${Date.now()}-${event.id}-${session.sessionId}-${section.sectionId}-${r}-${s}-${Math.random().toString(36).substr(2,5)}`,
                                    username: null, concertId: event.id, sessionId: session.sessionId, sectionId: section.sectionId,
                                    purchaseTime: null, paymentMethod: null, status: 'normal',
                                    seats: [{ row: r, seat: s, label: `${rowLabel}排${s}號` }],
                                    totalPrice: section.price
                                });
                            }
                        }
                    }
                } else {
                    // 自由座：根據總票數和已售出票數，產生剩餘數量的票券
                    const soldCount = soldTicketsInSection.reduce((total, ticket) => total + (ticket.seats ? ticket.seats.length : 0), 0);
                    const remainingAvailable = Math.max(0, section.ticketsAvailable - soldCount);

                    for (let i = 0; i < remainingAvailable; i++) {
                        newNormalTickets.push({
                            ticketId: `T${Date.now()}-${event.id}-${session.sessionId}-${section.sectionId}-ga-${i}-${Math.random().toString(36).substr(2,5)}`,
                            username: null, concertId: event.id, sessionId: session.sessionId, sectionId: section.sectionId,
                            purchaseTime: null, paymentMethod: null, status: 'normal',
                            seats: [{ type: 'generalAdmission', description: '自由座' }],
                            totalPrice: section.price
                        });
                    }
                }
            });
        });
    });

    // 3. 將 appData.tickets 設置為已售出票券加上新產生的可販售票券
    appData.tickets.splice(0, appData.tickets.length, ...nonNormalTickets, ...newNormalTickets);
}

// --- Admin-specific event management UI ---
// 2. renderAdminEventManagementUI: Added parentElement parameter.
export function renderAdminEventManagementUI(parentElement, targetContainerId = 'adminContent') {
    const container = parentElement.querySelector(`#${targetContainerId}`);
    if (!container) {
        console.error("Target container for event management not found in parentElement:", targetContainerId, parentElement);
        parentElement.innerHTML = `<p>錯誤: 票務管理介面容器 #${targetContainerId} 找不到。</p>`;
        return;
    }
    container.innerHTML = `
    <h3>活動票務管理 (管理員)</h3>
    <div id="eventListAdmin"></div>
    <form id="addEventFormAdmin" style="margin-top:1rem; max-width:500px;">
      <h4>新增主活動</h4>
      <label for="eventTitleAdmin">主活動標題</label>
      <input type="text" id="eventTitleAdmin" required />
      <label for="eventVenueAdmin">場地</label>
      <select id="eventVenueAdmin" required></select>
      <label for="eventImageUrlAdmin">主活動圖片 URL</label>
      <input type="url" id="eventImageUrlAdmin" placeholder="https://example.com/image.jpg" />
      <button type="submit" style="margin-top:1rem;">建立主活動</button>
      <p id="addEventMsgAdmin" class="success" style="display:none;"></p>
      <p id="addEventErrorAdmin" class="error" style="display:none;"></p>
    </form>
    <!-- Removed static session form container -->
  `;
    em_uiHelpers.populateVenueOptions(container.querySelector('#eventVenueAdmin'), em_appData.venues);
    // 3. renderEventListInternal: Pass 'container' as the search scope.
    // Dependencies are passed explicitly for clarity or if they were not module-scoped.
    renderEventListInternal(container, 'eventListAdmin', true);

    const addEventFormAdmin = container.querySelector('#addEventFormAdmin');
    if (addEventFormAdmin) {
        addEventFormAdmin.addEventListener('submit', e => {
            e.preventDefault();
            const title = container.querySelector('#eventTitleAdmin').value.trim();
            const venueId = parseInt(container.querySelector('#eventVenueAdmin').value);
            const imageUrl = container.querySelector('#eventImageUrlAdmin').value.trim();
            const msg = container.querySelector('#addEventMsgAdmin');
            const err = container.querySelector('#addEventErrorAdmin');
            msg.style.display = 'none';
            err.style.display = 'none';

            if (!title || !venueId) {
                err.textContent = '主活動標題和場地為必填欄位';
                err.style.display = 'block';
                return;
            }
            const venue = em_appData.venues.find(v => v.id === venueId);
            if (!venue) {
                err.textContent = '選擇的場地不存在';
                err.style.display = 'block';
                return;
            }
            
            let organizerId = 'admin_created'; 
            const currentUser = em_getCurrentUserCallback ? em_getCurrentUserCallback() : null;
            if (currentUser) {
                organizerId = currentUser.username;
            }

            const id = em_appData.concerts.length ? Math.max(...em_appData.concerts.map(c => c.id)) + 1 : 1;
            const newEvent = { id, title, venueId, organizerId, imageUrl: imageUrl || null, sessions: [] };
            em_appData.concerts.push(newEvent);
            em_saveDataCallback();
            msg.textContent = '主活動建立成功！現在可以為此活動新增場次。';
            msg.style.display = 'block';
            addEventFormAdmin.reset();
            renderEventListInternal(container, 'eventListAdmin', true);
            // Pass 'container' to showAddSessionFormAsModal for list refresh context
            showAddSessionFormAsModal(newEvent, 'Admin', container);
        });
    }
}

// --- Organizer-specific event management UI ---
// Note: renderOrganizerEventManagementUI would need similar changes to accept parentElement
export function renderOrganizerEventManagementUI(containerElement) { // Changed parameter name and removed targetContainerId
    const container = containerElement; // Use the passed DOM element directly

     if (!container) {
        console.error("Container element for organizer event management not provided or is invalid. UI cannot be rendered.");
        // If containerElement was indeed the intended parent and it's null, we can't set its innerHTML.
        return;
    }
    container.innerHTML = `
      <h3>票務管理 (主辦方)</h3>
      <div id="eventListOrg"></div>
      <form id="addEventFormOrg" style="margin-top:1rem; max-width:500px;">
        <h4>新增主活動</h4>
        <label for="eventTitleOrg">主活動標題</label>
        <input type="text" id="eventTitleOrg" required />
        <label for="eventVenueOrg">場地</label>
        <select id="eventVenueOrg" required></select>
        <label for="eventImageUrlOrg">主活動圖片 URL</label>
        <input type="url" id="eventImageUrlOrg" placeholder="https://example.com/image.jpg" />
        <button type="submit" style="margin-top:1rem;">建立主活動</button>
        <p id="addEventMsgOrg" class="success" style="display:none;"></p>
        <p id="addEventErrorOrg" class="error" style="display:none;"></p>
      </form>
    `;
    // Ensure em_uiHelpers and em_appData are initialized and available
    if (!em_uiHelpers || !em_appData || !em_appData.venues) {
        console.error("Event management module not properly initialized or data missing for organizer UI.");
        container.innerHTML = "<p>模組初始化錯誤，無法載入主辦方票務管理。</p>";
        return;
    }
    em_uiHelpers.populateVenueOptions(container.querySelector('#eventVenueOrg'), em_appData.venues);
    renderEventListInternal(container, 'eventListOrg', false); 

    const addEventFormOrg = container.querySelector('#addEventFormOrg');
    if (addEventFormOrg) {
        addEventFormOrg.addEventListener('submit', e => {
            e.preventDefault();
            const title = container.querySelector('#eventTitleOrg').value.trim();
            const venueId = parseInt(container.querySelector('#eventVenueOrg').value);
            const imageUrl = container.querySelector('#eventImageUrlOrg').value.trim();
            const msg = container.querySelector('#addEventMsgOrg');
            const err = container.querySelector('#addEventErrorOrg');
            msg.style.display = 'none';
            err.style.display = 'none';

            if (!title || !venueId) {
                err.textContent = '主活動標題和場地為必填欄位';
                err.style.display = 'block';
                return;
            }
            const venue = em_appData.venues.find(v => v.id === venueId);
            if (!venue) {
                err.textContent = '選擇的場地不存在';
                err.style.display = 'block';
                return;
            }
            const currentUser = em_getCurrentUserCallback ? em_getCurrentUserCallback() : null;
            if (!currentUser || !currentUser.roles.includes('organizer')) {
                err.textContent = '只有主辦方才能建立活動。';
                err.style.display = 'block';
                return;
            }
            const organizerId = currentUser.username;
            const id = em_appData.concerts.length ? Math.max(...em_appData.concerts.map(c => c.id)) + 1 : 1;
            const newEvent = { id, title, venueId, organizerId, imageUrl: imageUrl || null, sessions: [] };
            em_appData.concerts.push(newEvent);
            em_saveDataCallback();
            msg.textContent = '主活動建立成功！現在可以為此活動新增場次。';
            msg.style.display = 'block';
            addEventFormOrg.reset();
            renderEventListInternal(container, 'eventListOrg', false);
            showAddSessionFormAsModal(newEvent, 'Org', container); // Pass container
        });
    }
}

// --- Shared Internal Functions ---
// showAddSessionFormAsModal: Added 'parentListContainer' for list refresh context
function showAddSessionFormAsModal(event, rolePrefix, parentListContainer) {
    const modalTitle = `新增場次到 \\"${event.title}\\"`;
    const venue = em_appData.venues.find(v => v.id === event.venueId);
    if (!venue || !venue.seatMap) {
        console.error('Venue or seat map not found for event:', event);
        em_uiHelpers.createModal('錯誤', '<p>找不到場地資訊或座位區域設定，無法新增場次。</p>', [{ text: '關閉', onClick: () => em_uiHelpers.removeModal() }]);
        return;
    }

    let sectionsHtml = '';
    venue.seatMap.forEach(section => {
        sectionsHtml += `
        <fieldset style="margin-bottom: 10px; border: 1px solid #ccc; padding: 10px;">
            <legend>${section.name} (容量: ${section.capacity})</legend>
            <input type="hidden" class="session-section-id" value="${section.id}">
            <div>
                <label for="modalSessionPrice_${section.id}">票價 (NT$)</label>
                <input type="number" id="modalSessionPrice_${section.id}" class="session-section-price" min="0" required />
            </div>
            <div>
                <label for="modalSessionTickets_${section.id}">可售票數量</label>
                <input type="number" id="modalSessionTickets_${section.id}" class="session-section-tickets" min="0" max="${section.capacity}" required />
            </div>
        </fieldset>
        `;
    });

    const formHtml = `
        <input type=\"hidden\" id=\"modalSelectedEventId\" value=\"${event.id}\">
        <input type=\"hidden\" id=\"modalSelectedEventVenueId\" value=\"${event.venueId}\">
        <div>
            <label for=\"modalSessionDateTime\">場次日期與時間</label>
            <input type=\"datetime-local\" id=\"modalSessionDateTime\" required />
        </div>
        <h5 style=\"margin-top:1rem; margin-bottom:0.5rem;\">各區域票價與票數設定:</h5>
        ${sectionsHtml}
        <div>
            <label for="modalSessionSalesStart">售票開始時間</label>
            <input type="datetime-local" id="modalSessionSalesStart" required />
        </div>
        <div>
            <label for="modalSessionSalesEnd">售票結束時間</label>
            <input type="datetime-local" id="modalSessionSalesEnd" required />
        </div>
        <p id="modalAddSessionMsg" class="success" style="display:none; margin-top: 10px;"></p>
        <p id="modalAddSessionError" class="error" style="display:none; margin-top: 10px;"></p>
    `;

    const modalButtons = [
        {
            text: '儲存場次',
            className: 'btn-primary',
            onClick: () => {
                // Pass parentListContainer to handleSaveSessionFromModal
                handleSaveSessionFromModal(rolePrefix, parentListContainer);
            }
        },
        {
            text: '取消',
            className: 'btn-secondary',
            onClick: () => em_uiHelpers.removeModal()
        }
    ];

    em_uiHelpers.createModal(modalTitle, formHtml, modalButtons);
    // Clear previous values if any
    document.getElementById('modalSessionDateTime').value = '';
    document.querySelectorAll('.session-section-price').forEach(input => input.value = '');
    document.querySelectorAll('.session-section-tickets').forEach(input => input.value = '');
    document.getElementById('modalSessionSalesStart').value = '';
    document.getElementById('modalSessionSalesEnd').value = '';
    document.getElementById('modalAddSessionMsg').style.display = 'none';
    document.getElementById('modalAddSessionError').style.display = 'none';
}

// handleSaveSessionFromModal: Added 'parentListContainer' for list refresh context
function handleSaveSessionFromModal(rolePrefix, parentListContainer) {
    const eventId = parseInt(document.getElementById('modalSelectedEventId').value);
    const venueId = parseInt(document.getElementById('modalSelectedEventVenueId').value);
    const dateTime = document.getElementById('modalSessionDateTime').value;
    const salesStartDateTime = document.getElementById('modalSessionSalesStart').value;
    const salesEndDateTime = document.getElementById('modalSessionSalesEnd').value;

    const msg = document.getElementById('modalAddSessionMsg');
    const err = document.getElementById('modalAddSessionError');
    msg.style.display = 'none';
    err.style.display = 'none';

    const event = em_appData.concerts.find(c => c.id === eventId);
    if (!event) {
        err.textContent = '找不到對應的主活動';
        err.style.display = 'block';
        return;
    }
    const venue = em_appData.venues.find(v => v.id === venueId);
    if (!venue || !venue.seatMap) {
        err.textContent = '找不到場地資訊或座位區域設定';
        err.style.display = 'block';
        return;
    }
    if (!dateTime || !salesStartDateTime || !salesEndDateTime) {
        err.textContent = '場次時間、售票開始/結束時間為必填';
        err.style.display = 'block';
        return;
    }
    if (new Date(salesEndDateTime) <= new Date(salesStartDateTime)) {
        err.textContent = '售票結束時間必須晚於開始時間';
        err.style.display = 'block';
        return;
    }
    if (new Date(dateTime) <= new Date(salesEndDateTime)) {
        err.textContent = '活動時間必須晚於售票結束時間';
        err.style.display = 'block';
        return;
    }
    if (new Date(dateTime) <= new Date(salesStartDateTime)) {
        err.textContent = '活動時間必須晚於售票開始時間';
        err.style.display = 'block';
        return;
    }

    const sectionsData = [];
    let totalTicketsForSession = 0;
    let sectionInputError = false;

    const sectionNodes = document.querySelectorAll('.session-section-id');
    sectionNodes.forEach(node => {
        const sectionId = node.value;
        const priceEl = document.getElementById(`modalSessionPrice_${sectionId}`);
        const ticketsEl = document.getElementById(`modalSessionTickets_${sectionId}`);
        
        if (!priceEl || !ticketsEl) {
            console.error(`Price or tickets element not found for section ${sectionId}`);
            sectionInputError = true;
            return;
        }

        const price = parseInt(priceEl.value);
        const ticketsAvailable = parseInt(ticketsEl.value);
        const venueSection = venue.seatMap.find(s => s.id === sectionId);

        if (isNaN(price) || price < 0 || isNaN(ticketsAvailable) || ticketsAvailable < 0) {
            err.textContent = `區域 "${venueSection ? venueSection.name : sectionId}" 的票價和票數必須是有效的非負數字。`;
            sectionInputError = true;
            return;
        }
        if (venueSection && ticketsAvailable > venueSection.capacity) {
            err.textContent = `區域 "${venueSection.name}" 的可售票數 (${ticketsAvailable}) 不可超過該區域容量 (${venueSection.capacity})。`;
            sectionInputError = true;
            return;
        }
        sectionsData.push({
            sectionId,
            price,
            ticketsAvailable
        });
        totalTicketsForSession += ticketsAvailable;
    });

    if (sectionInputError) {
        err.style.display = 'block';
        return;
    }

    if (sectionsData.length !== venue.seatMap.length) {
        err.textContent = '未能讀取所有區域的票務資訊，請檢查。';
        err.style.display = 'block';
        return;
    }

    const sessionId = `${eventId}-${event.sessions.length + 1}`;
    event.sessions.push({
        sessionId, // Corrected: Use the generated sessionId
        dateTime,
        salesStartDateTime,
        salesEndDateTime,
        sections: sectionsData
    });
    // === 新增：自動產生預設票券 ===
    if (!em_appData.tickets) em_appData.tickets = [];
    sectionsData.forEach(section => {
        const venueSection = em_appData.venues.find(v => v.id === event.venueId)?.seatMap.find(s => s.id === section.sectionId);
        if (venueSection && venueSection.seatingType === 'numbered' && venueSection.rows && venueSection.seatsPerRow) {
            // 對號座：每個座位都產生一張票券
            for (let r = 1; r <= venueSection.rows; r++) {
                const rowLabel = rowNumberToLetter(r);
                for (let s = 1; s <= venueSection.seatsPerRow; s++) {
                    em_appData.tickets.push({
                        ticketId: `T${Date.now()}-${eventId}-${sessionId}-${section.sectionId}-${r}-${s}-${Math.random().toString(36).substr(2,5)}`,
                        username: null,
                        concertId: eventId,
                        sessionId: sessionId,
                        sectionId: section.sectionId,
                        purchaseTime: null,
                        paymentMethod: null,
                        status: 'normal',
                        seats: [{ row: r, seat: s, label: `${rowLabel}排${s}號` }],
                        totalPrice: section.price
                    });
                }
            }
        } else {
            // 自由座：產生 ticketsAvailable 數量的票券
            for (let i = 0; i < section.ticketsAvailable; i++) {
                em_appData.tickets.push({
                    ticketId: `T${Date.now()}-${eventId}-${sessionId}-${section.sectionId}-${i}-${Math.random().toString(36).substr(2,5)}`,
                    username: null,
                    concertId: eventId,
                    sessionId: sessionId,
                    sectionId: section.sectionId,
                    purchaseTime: null,
                    paymentMethod: null,
                    status: 'normal',
                    seats: [{ type: 'generalAdmission', description: '自由座' }],
                    totalPrice: section.price
                });
            }
        }
    });
    em_saveDataCallback();
    msg.textContent = '場次新增成功！';
    msg.style.display = 'block';
    
    setTimeout(() => {
        em_uiHelpers.removeModal();
        // Use parentListContainer for refreshing the list
        renderEventListInternal(parentListContainer, rolePrefix === 'Admin' ? 'eventListAdmin' : 'eventListOrg', rolePrefix === 'Admin');
    }, 1500);
}

/**
 * 強制補齊指定場次、區域的所有可販售票券（對號座/自由座皆可）
 * @param {Object} appData - 全域資料物件
 * @param {String|Number} concertId
 * @param {String|Number} sessionId
 * @param {String|Number} sectionId
 */
export function fixSectionTickets(appData, concertId, sessionId, sectionId) {
    if (!appData.tickets) appData.tickets = [];
    // 先移除該區所有 normal 狀態的票券
    appData.tickets = appData.tickets.filter(t =>
        !(String(t.concertId) === String(concertId) &&
          String(t.sessionId) === String(sessionId) &&
          String(t.sectionId) === String(sectionId) &&
          t.status === 'normal')
    );
    const event = appData.concerts.find(e => String(e.id) === String(concertId));
    if (!event) return;
    const session = event.sessions.find(s => String(s.sessionId) === String(sessionId));
    if (!session) return;
    const section = session.sections.find(sec => String(sec.sectionId) === String(sectionId));
    if (!section) return;
    const venue = appData.venues.find(v => v.id === event.venueId);
    const venueSection = venue ? venue.seatMap.find(s => s.id === section.sectionId) : null;
    if (venueSection && venueSection.seatingType === 'numbered' && venueSection.rows && venueSection.seatsPerRow) {
        for (let r = 1; r <= venueSection.rows; r++) {
            const rowLabel = rowNumberToLetter(r);
            for (let s = 1; s <= venueSection.seatsPerRow; s++) {
                appData.tickets.push({
                    ticketId: `T${Date.now()}-${concertId}-${sessionId}-${sectionId}-${r}-${s}-${Math.random().toString(36).substr(2,5)}`,
                    username: null,
                    concertId,
                    sessionId,
                    sectionId,
                    purchaseTime: null,
                    paymentMethod: null,
                    status: 'normal',
                    seats: [{ row: r, seat: s, label: `${rowLabel}排${s}號` }],
                    totalPrice: section.price
                });
            }
        }
    } else {
        // 自由座
        for (let i = 0; i < section.ticketsAvailable; i++) {
            appData.tickets.push({
                ticketId: `T${Date.now()}-${concertId}-${sessionId}-${sectionId}-${i}-${Math.random().toString(36).substr(2,5)}`,
                username: null,
                concertId,
                sessionId,
                sectionId,
                purchaseTime: null,
                paymentMethod: null,
                status: 'normal',
                seats: [{ type: 'generalAdmission', description: '自由座' }],
                totalPrice: section.price
            });
        }
    }
}

// 4. renderEventListInternal: Added searchScopeElement parameter.
// It now uses this parameter to find the listElementId.
// Dependencies like em_appData, em_getCurrentUserCallback are accessed from module scope.
function renderEventListInternal(searchScopeElement, listElementId, isAdminView) {
    const listElement = searchScopeElement.querySelector(`#${listElementId}`);
    if (!listElement) {
        console.error("Event list element not found in provided searchScopeElement:", listElementId, searchScopeElement);
        searchScopeElement.innerHTML += `<p>錯誤: 事件列表容器 #${listElementId} 找不到。</p>`;
        return;
    }
    listElement.innerHTML = ''; 

    const eventsToDisplay = em_appData.concerts.filter(event => {
        if (isAdminView) return true; 
        const currentUser = em_getCurrentUserCallback ? em_getCurrentUserCallback() : null;
        return currentUser && event.organizerId === currentUser.username;
    });

    if (eventsToDisplay.length === 0) {
        listElement.innerHTML = '<p>目前沒有活動。</p>';
        return;
    }

    eventsToDisplay.forEach(event => {
        const eventDiv = document.createElement('div');
        eventDiv.className = 'event-item-container';
        const venue = em_appData.venues.find(v => v.id === event.venueId);
        
        let eventImageHtml = '';
        if (event.imageUrl) {
            eventImageHtml = `<img src=\"${event.imageUrl}\" alt=\"${event.title}\" style=\"max-width: 200px; max-height: 150px; object-fit: cover; margin-bottom: 10px; border-radius: 4px;\">`;
        }

        let sessionsHtml = '<ul class="sessions-list">';
        if (event.sessions && event.sessions.length > 0) {
            event.sessions.forEach(session => {
                let sectionsDetailHtml = '<ul style="padding-left: 20px; font-size: 0.9em;">';
                if (session.sections && session.sections.length > 0) {
                    session.sections.forEach(sect => {
                        const venueSection = venue ? venue.seatMap.find(s => s.id === sect.sectionId) : null;
                        const sectionName = venueSection ? venueSection.name : sect.sectionId;
                        // 修正：售出票券的計算方式，以反映所有已分配的票券（包含已購買、公關票等）。
                        const soldCount = getSectionSoldCount(event.id, session.sessionId, sect.sectionId, em_appData.tickets);
                        sectionsDetailHtml += `<li><strong>${sectionName}:</strong> NT$${sect.price} | 售票: ${soldCount}/${sect.ticketsAvailable}</li>`;
                    });
                } else {
                    sectionsDetailHtml += '<li>此場次尚無區域票價設定。</li>';
                }
                sectionsDetailHtml += '</ul>';

                const currentUser = em_getCurrentUserCallback ? em_getCurrentUserCallback() : null;
                const isOrganizerOfEvent = currentUser && event.organizerId === currentUser.username;

                let actionButtonsHtml = '';
                if (isAdminView) {
                    actionButtonsHtml = `
                        <button class=\"edit-session-btn\" data-event-id=\"${event.id}\" data-session-id=\"${session.sessionId}\" style=\"margin-left: 10px; vertical-align: top; background-color: var(--accent-color);\">編輯此場次</button>
                        <button class=\"delete-session-btn\" data-event-id=\"${event.id}\" data-session-id=\"${session.sessionId}\" style=\"margin-left: 10px; vertical-align: top;\">刪除此場次</button>
                    `;
                } else if (isOrganizerOfEvent) { 
                     actionButtonsHtml = `
                        <button class=\"edit-session-btn\" data-event-id=\"${event.id}\" data-session-id=\"${session.sessionId}\" style=\"margin-left: 10px; vertical-align: top; background-color: var(--accent-color);\">編輯此場次</button>
                    `;
                }

                sessionsHtml += `
                    <li style=\"margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid #eee;\">
                        <div>
                            <strong>場次:</strong> ${new Date(session.dateTime).toLocaleString()} <br>
                            <strong>售票期間:</strong> ${new Date(session.salesStartDateTime).toLocaleDateString()} - ${new Date(session.salesEndDateTime).toLocaleDateString()} <br>
                            <strong>票務詳情:</strong>
                            ${sectionsDetailHtml}
                        </div>
                        ${actionButtonsHtml}
                    </li>
                `;
            });
        } else {
            sessionsHtml += '<li>此活動尚無場次。</li>';
        }
        sessionsHtml += '</ul>';

        eventDiv.innerHTML = `
            <h4>${event.title} (ID: ${event.id})</h4>
            ${eventImageHtml}
            <p><strong>描述:</strong> ${event.description || '無描述'}</p>
            <p><strong>分類:</strong> ${event.category || '未分類'}</p>
            <p><strong>場地:</strong> ${venue ? venue.name : '未知'} | <strong>主辦方:</strong> ${event.organizerId || 'N/A'}</p>
            ${sessionsHtml}
            <button class=\"edit-event-btn\" data-event-id=\"${event.id}\" style=\"margin-right: 5px; background-color: var(--info-color);\">編輯活動資訊</button>
            <button class=\"add-session-to-event-btn\" data-event-id=\"${event.id}\" style=\"margin-right: 5px;\">為此活動新增場次</button>
            ${isAdminView ? `<button class=\"delete-event-btn\" data-event-id=\"${event.id}\">刪除整個活動</button>` : ''}
            <hr>
        `;
        listElement.appendChild(eventDiv);
    });

    // Event listener for new "Edit Event" buttons
    listElement.querySelectorAll('.edit-event-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const eventId = parseInt(e.target.dataset.eventId);
            const eventToEdit = em_appData.concerts.find(c => c.id === eventId);
            if (eventToEdit) {
                showEditEventFormAsModal(eventToEdit, isAdminView ? 'Admin' : 'Org', searchScopeElement);
            } else {
                console.error('Event to edit not found:', eventId);
                em_uiHelpers.createModal('錯誤', '<p>找不到要編輯的活動資料。</p>', [{ text: '關閉', onClick: () => em_uiHelpers.removeModal() }]);
            }
        });
    });

    listElement.querySelectorAll('.add-session-to-event-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const eventId = parseInt(e.target.dataset.eventId);
            const event = em_appData.concerts.find(c => c.id === eventId);
            if (event) {
                // Pass searchScopeElement (which is the parent of listElement) for list refresh context
                showAddSessionFormAsModal(event, isAdminView ? 'Admin' : 'Org', searchScopeElement);
            }
        });
    });

    listElement.querySelectorAll('.edit-session-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const eventId = parseInt(e.target.dataset.eventId);
            const sessionId = e.target.dataset.sessionId;
            const event = em_appData.concerts.find(c => c.id === eventId);
            if (event) {
                const sessionToEdit = event.sessions.find(s => s.sessionId === sessionId);
                if (sessionToEdit) {
                    // Pass searchScopeElement for list refresh context
                    showEditSessionFormAsModal(event, sessionToEdit, isAdminView ? 'Admin' : 'Org', searchScopeElement);
                } else {
                    console.error('Session to edit not found:', sessionId);
                    em_uiHelpers.createModal('錯誤', '<p>找不到要編輯的場次資料。</p>', [{ text: '關閉', onClick: () => em_uiHelpers.removeModal() }]);
                }
            } else {
                console.error('Event not found for editing session:', eventId);
                 em_uiHelpers.createModal('錯誤', '<p>找不到相關的活動資料。</p>', [{ text: '關閉', onClick: () => em_uiHelpers.removeModal() }]);
            }
        });
    });

    // Delete session buttons (ensure em_saveDataCallback and em_uiHelpers are used)
    listElement.querySelectorAll('.delete-session-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const eventId = parseInt(e.target.dataset.eventId);
            const sessionId = e.target.dataset.sessionId;
            if (confirm(`您確定要刪除活動 ID ${eventId} 的場次 ${sessionId} 嗎？`)) {
                const event = em_appData.concerts.find(c => c.id === eventId);
                if (event) {
                    const sessionIndex = event.sessions.findIndex(s => s.sessionId === sessionId);
                    if (sessionIndex !== -1) {
                        // Check if tickets sold before deleting
                        const sessionToDelete = event.sessions[sessionIndex];
                        let ticketsSoldInSession = 0;
                        if(sessionToDelete.sections) {
                            sessionToDelete.sections.forEach(sec => {
                                ticketsSoldInSession += getSectionSoldCount(event.id, sessionToDelete.sessionId, sec.sectionId, em_appData.tickets);
                            });
                        }

                        if (ticketsSoldInSession > 0) {
                            createModal('提示', `<p>無法刪除場次 ${sessionId}，因為已有 ${ticketsSoldInSession} 張票售出。請先處理相關票券。</p>`, [{ text: '確定', onClick: () => removeModal() }]);
                            return;
                        }

                        event.sessions.splice(sessionIndex, 1);
                        em_saveDataCallback();
                        renderEventListInternal(searchScopeElement, listElementId, isAdminView); // Refresh list
                        createModal('完成', `<p>場次 ${sessionId} 已成功刪除。</p>`, [{ text: '確定', onClick: () => removeModal() }]);
                    }
                }
            }
        });
    });
    
    // Delete event buttons (ensure em_saveDataCallback and em_uiHelpers are used)
    listElement.querySelectorAll('.delete-event-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const eventId = parseInt(e.target.dataset.eventId);
            if (confirm(`您確定要刪除整個活動 ID ${eventId} (包含所有場次) 嗎？此操作無法復原。`)) {
                 const eventIndex = em_appData.concerts.findIndex(c => c.id === eventId);
                if (eventIndex !== -1) {
                    // Check for sold tickets in any session of the event
                    const eventToDelete = em_appData.concerts[eventIndex];
                    let totalTicketsSoldInEvent = 0;
                    if (eventToDelete.sessions) {
                        eventToDelete.sessions.forEach(session => {
                            if (session.sections) {
                                session.sections.forEach(sec => {
                                    totalTicketsSoldInEvent += getSectionSoldCount(eventToDelete.id, session.sessionId, sec.sectionId, em_appData.tickets);
                                });
                            }
                        });
                    }

                    if (totalTicketsSoldInEvent > 0) {
                        createModal('提示', `<p>無法刪除活動 ${eventToDelete.title}，因為其下場次總共已售出 ${totalTicketsSoldInEvent} 張票。請先處理相關票券。</p>`, [{ text: '確定', onClick: () => removeModal() }]);
                        return;
                    }
                    
                    em_appData.concerts.splice(eventIndex, 1);
                    em_saveDataCallback();
                    renderEventListInternal(searchScopeElement, listElementId, isAdminView); // Refresh list
                    createModal('完成', `<p>活動 ID ${eventId} 已成功刪除。</p>`, [{ text: '確定', onClick: () => removeModal() }]);
                }
            }
        });
    });
}


// showEditEventFormAsModal: Function to show modal for editing an existing event's main details
function showEditEventFormAsModal(event, rolePrefix, parentListContainer) {
    const modalTitle = `編輯活動資訊: ${event.title}`;
    const isAdmin = rolePrefix === 'Admin';

    const formHtml = `
        <input type=\"hidden\" id=\"modalEditEventId\" value=\"${event.id}\">
        <div>
            <label for=\"modalEditEventTitle\">活動標題</label>
            <input type=\"text\" id=\"modalEditEventTitle\" value=\"${event.title}\" required />
        </div>
        <div>
            <label for=\"modalEditEventDescription\">活動描述</label>
            <textarea id=\"modalEditEventDescription\" rows=\"3\" style=\"width:98%;\">${event.description || ''}</textarea>
        </div>
        <div>
            <label for=\"modalEditEventImageUrl\">活動圖片 URL</label>
            <input type=\"url\" id=\"modalEditEventImageUrl\" value=\"${event.imageUrl || ''}\" placeholder=\"https://example.com/image.jpg\" />
        </div>
        <div>
            <label for=\"modalEditEventCategory\">活動分類</label>
            <input type=\"text\" id=\"modalEditEventCategory\" value=\"${event.category || ''}\" placeholder=\"例如：流行、搖滾、古典\" />
        </div>
        <div>
            <label for=\"modalEditEventVenue\">場地</label>
            <select id=\"modalEditEventVenue\" required></select>
        </div>
        <div>
            <label for=\"modalEditEventOrganizer\">主辦方</label>
            <input type=\"text\" id=\"modalEditEventOrganizer\" value=\"${event.organizerId || ''}\" ${isAdmin ? '' : 'readonly'} />
        </div>
        <p id=\"modalEditEventMsg\" class=\"success\" style=\"display:none; margin-top: 10px;\"></p>
        <p id=\"modalEditEventError\" class=\"error\" style=\"display:none; margin-top: 10px;\"></p>
    `;

    const modalButtons = [
        {
            text: '儲存變更',
            className: 'btn-primary',
            onClick: () => handleSaveEventChangesFromModal(rolePrefix, parentListContainer)
        },
        {
            text: '取消',
            className: 'btn-secondary',
            onClick: () => em_uiHelpers.removeModal()
        }
    ];

    em_uiHelpers.createModal(modalTitle, formHtml, modalButtons);
    em_uiHelpers.populateVenueOptions(document.getElementById('modalEditEventVenue'), em_appData.venues, event.venueId);
}

// Function to handle saving changes to an event's main details from the modal
function handleSaveEventChangesFromModal(rolePrefix, parentListContainer) {
    const eventId = parseInt(document.getElementById('modalEditEventId').value);
    const title = document.getElementById('modalEditEventTitle').value.trim();
    const description = document.getElementById('modalEditEventDescription').value.trim();
    const imageUrl = document.getElementById('modalEditEventImageUrl').value.trim();
    const category = document.getElementById('modalEditEventCategory').value.trim();
    const venueId = parseInt(document.getElementById('modalEditEventVenue').value);
    const organizerId = document.getElementById('modalEditEventOrganizer').value.trim(); // Potentially editable by admin

    const msg = document.getElementById('modalEditEventMsg');
    const err = document.getElementById('modalEditEventError');
    msg.style.display = 'none';
    err.style.display = 'none';

    if (!title || !venueId || (rolePrefix === 'Admin' && !organizerId)) {
        err.textContent = '活動標題、場地為必填。管理員模式下主辦方也為必填。';
        err.style.display = 'block';
        return;
    }

    const eventIndex = em_appData.concerts.findIndex(c => c.id === eventId);
    if (eventIndex === -1) {
        err.textContent = '找不到要更新的活動。';
        err.style.display = 'block';
        return;
    }

    const venue = em_appData.venues.find(v => v.id === venueId);
    if (!venue) {
        err.textContent = '選擇的場地無效。';
        err.style.display = 'block';
        return;
    }

    // Update event data
    em_appData.concerts[eventIndex].title = title;
    em_appData.concerts[eventIndex].description = description;
    em_appData.concerts[eventIndex].imageUrl = imageUrl || null;
    em_appData.concerts[eventIndex].category = category;
    em_appData.concerts[eventIndex].venueId = venueId;
    if (rolePrefix === 'Admin') { // Only admin can change organizer
        em_appData.concerts[eventIndex].organizerId = organizerId;
    }
    // Note: If venue changes, existing sessions' section data might become invalid if the new venue has a different seatMap.
    // This is a complex scenario. For now, we assume the user is aware or we might need further logic to handle/validate this.
    // A simple approach could be to warn the user or clear sessions if the venue changes significantly.
    // For now, we'll just update. If the venue change causes issues with session sections, that's a follow-up.

    em_saveDataCallback();
    msg.textContent = '活動資訊更新成功！';
    msg.style.display = 'block';

    setTimeout(() => {
        em_uiHelpers.removeModal();
        renderEventListInternal(parentListContainer, rolePrefix === 'Admin' ? 'eventListAdmin' : 'eventListOrg', rolePrefix === 'Admin');
    }, 1500);
}

// === 共用票券統計函式 ===
/**
 * 計算某區已分配/已購票/公關票的張數（不含預設票）
 * 新邏輯：加總所有符合條件的票券物件中的座位數量 (seats.length)
 */
export function getSectionSoldCount(concertId, sessionId, sectionId, tickets) {
    return (tickets || []).filter(t =>
        String(t.concertId) === String(concertId) &&
        String(t.sessionId) === String(sessionId) &&
        String(t.sectionId) === String(sectionId) &&
        t.status !== 'normal'
    ).reduce((total, ticket) => total + (ticket.seats ? ticket.seats.length : 0), 0);
}
/**
 * 計算某區剩餘可售票數
 */
export function getSectionAvailableCount(concertId, sessionId, sectionId, tickets, ticketsAvailable) {
    const sold = getSectionSoldCount(concertId, sessionId, sectionId, tickets);
    return Math.max(0, ticketsAvailable - sold);
}

