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
            ticketsAvailable,
            ticketsSold: 0
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
    em_saveDataCallback();
    msg.textContent = '場次新增成功！';
    msg.style.display = 'block';
    
    setTimeout(() => {
        em_uiHelpers.removeModal();
        // Use parentListContainer for refreshing the list
        renderEventListInternal(parentListContainer, rolePrefix === 'Admin' ? 'eventListAdmin' : 'eventListOrg', rolePrefix === 'Admin');
    }, 1500);
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

        let sessionsHtml = '<ul class=\"sessions-list\">';
        if (event.sessions && event.sessions.length > 0) {
            event.sessions.forEach(session => {
                let sectionsDetailHtml = '<ul style=\"padding-left: 20px; font-size: 0.9em;\">';
                if (session.sections && session.sections.length > 0) {
                    session.sections.forEach(sect => {
                        const venueSection = venue ? venue.seatMap.find(s => s.id === sect.sectionId) : null;
                        const sectionName = venueSection ? venueSection.name : sect.sectionId;
                        sectionsDetailHtml += `<li><strong>${sectionName}:</strong> NT$${sect.price} | 售票: ${sect.ticketsSold}/${sect.ticketsAvailable}</li>`;
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
                            sessionToDelete.sections.forEach(sec => ticketsSoldInSession += (sec.ticketsSold || 0));
                        }

                        if (ticketsSoldInSession > 0) {
                            alert(`無法刪除場次 ${sessionId}，因為已有 ${ticketsSoldInSession} 張票售出。請先處理相關票券。`);
                            return;
                        }

                        event.sessions.splice(sessionIndex, 1);
                        em_saveDataCallback();
                        renderEventListInternal(searchScopeElement, listElementId, isAdminView); // Refresh list
                        alert(`場次 ${sessionId} 已成功刪除。`);
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
                                session.sections.forEach(sec => totalTicketsSoldInEvent += (sec.ticketsSold || 0));
                            }
                        });
                    }

                    if (totalTicketsSoldInEvent > 0) {
                        alert(`無法刪除活動 ${eventToDelete.title}，因為其下場次總共已售出 ${totalTicketsSoldInEvent} 張票。請先處理相關票券。`);
                        return;
                    }
                    
                    em_appData.concerts.splice(eventIndex, 1);
                    em_saveDataCallback();
                    renderEventListInternal(searchScopeElement, listElementId, isAdminView); // Refresh list
                    alert(`活動 ID ${eventId} 已成功刪除。`);
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


// --- Admin-specific event management UI ---
// 2. renderAdminEventManagementUI: Added parentElement parameter.
// REMOVING DUPLICATE DEFINITION
/*
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
*/

// Function to show modal for editing a session
// showEditSessionFormAsModal: Added parentListContainer for list refresh context
function showEditSessionFormAsModal(event, session, rolePrefix, parentListContainer) {
    const modalTitle = `編輯場次於 \"${event.title}\"`;
    const venue = em_appData.venues.find(v => v.id === event.venueId);

    if (!venue || !venue.seatMap) {
        console.error('Venue or seat map not found for event:', event);
        em_uiHelpers.createModal('錯誤', '<p>找不到場地資訊或座位區域設定，無法編輯場次。</p>', [{ text: '關閉', onClick: () => em_uiHelpers.removeModal() }]);
        return;
    }

    let sectionsHtml = '';
    venue.seatMap.forEach(venueSection => {
        const existingSectionData = session.sections.find(s => s.sectionId === venueSection.id);
        const price = existingSectionData ? existingSectionData.price : 0;
        const ticketsAvailable = existingSectionData ? existingSectionData.ticketsAvailable : 0;
        // ticketsSold is not directly editable here but shown for info if needed, or used in validation

        sectionsHtml += `
        <fieldset style="margin-bottom: 10px; border: 1px solid #ccc; padding: 10px;">
            <legend>${venueSection.name} (場地容量: ${venueSection.capacity})</legend>
            <input type="hidden" class="edit-session-section-id" value="${venueSection.id}">
            <input type="hidden" class="edit-session-section-original-capacity" value="${venueSection.capacity}">
            <div>
                <label for="editModalSessionPrice_${venueSection.id}">票價 (NT$)</label>
                <input type="number" id="editModalSessionPrice_${venueSection.id}" class="edit-session-section-price" value="${price}" min="0" required />
            </div>
            <div>
                <label for="editModalSessionTickets_${venueSection.id}">可售票數量 (已售: ${existingSectionData ? existingSectionData.ticketsSold : 0})</label>
                <input type="number" id="editModalSessionTickets_${venueSection.id}" class="edit-session-section-tickets" value="${ticketsAvailable}" min="0" max="${venueSection.capacity}" required />
            </div>
        </fieldset>
        `;
    });
    
    const formHtml = `
        <input type=\"hidden\" id=\"modalEditSelectedEventId\" value=\"${event.id}\">
        <input type=\"hidden\" id=\"modalEditSelectedSessionId\" value=\"${session.sessionId}\">
        <input type=\"hidden\" id=\"modalEditSelectedEventVenueId\" value=\"${event.venueId}\">
        <div>
            <label for=\"modalEditSessionDateTime\">場次日期與時間</label>
            <input type=\"datetime-local\" id=\"modalEditSessionDateTime\" value=\"${session.dateTime ? new Date(session.dateTime).toISOString().substring(0, 16) : ''}\" required />
        </div>
        <h5 style=\"margin-top:1rem; margin-bottom:0.5rem;\">各區域票價與票數設定:</h5>
        ${sectionsHtml}
        <div>
            <label for="editModalSessionSalesStart">售票開始時間</label>
            <input type="datetime-local" id="editModalSessionSalesStart" value="${session.salesStartDateTime.substring(0,16)}" required />
        </div>
        <div>
            <label for="editModalSessionSalesEnd">售票結束時間</label>
            <input type="datetime-local" id="editModalSessionSalesEnd" value="${session.salesEndDateTime.substring(0,16)}" required />
        </div>
        <p id="modalEditSessionMsg" class="success" style="display:none; margin-top: 10px;"></p>
        <p id="modalEditSessionError" class="error" style="display:none; margin-top: 10px;"></p>
    `;

    const modalButtons = [
        {
            text: '儲存變更',
            className: 'btn-primary',
            onClick: () => {
                // Pass parentListContainer to handleSaveEditedSessionFromModal
                handleSaveEditedSessionFromModal(rolePrefix, parentListContainer);
            }
        },
        {
            text: '取消',
            className: 'btn-secondary',
            onClick: () => em_uiHelpers.removeModal()
        }
    ];
    em_uiHelpers.createModal(modalTitle, formHtml, modalButtons);
    // Clear previous values if any (though pre-filling is done above)
    document.getElementById('modalEditSessionMsg').style.display = 'none';
    document.getElementById('modalEditSessionError').style.display = 'none';
}

// handleSaveEditedSessionFromModal: Added 'parentListContainer' for list refresh context
function handleSaveEditedSessionFromModal(rolePrefix, parentListContainer) {
    const eventId = parseInt(document.getElementById('modalEditSelectedEventId').value);
    const sessionId = document.getElementById('modalEditSelectedSessionId').value;
    const venueId = parseInt(document.getElementById('modalEditSelectedEventVenueId').value); // Not strictly needed if eventId and sessionId are enough
    
    const dateTime = document.getElementById('modalEditSessionDateTime').value;
    const salesStartDateTime = document.getElementById('modalEditSessionSalesStart').value;
    const salesEndDateTime = document.getElementById('modalEditSessionSalesEnd').value;

    const msg = document.getElementById('modalEditSessionMsg');
    const err = document.getElementById('modalEditSessionError');
    msg.style.display = 'none';
    err.style.display = 'none';

    const event = em_appData.concerts.find(c => c.id === eventId);
    if (!event) { err.textContent = '找不到對應的主活動'; err.style.display = 'block'; return; }
    
    const sessionToUpdate = event.sessions.find(s => s.sessionId === sessionId);
    if (!sessionToUpdate) { err.textContent = '找不到要更新的場次'; err.style.display = 'block'; return; }

    const venue = em_appData.venues.find(v => v.id === event.venueId); // Use event.venueId
    if (!venue || !venue.seatMap) { err.textContent = '找不到場地資訊或座位區域設定'; err.style.display = 'block'; return; }

    // Validate general date/time fields first
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

    const updatedSectionsData = [];
    let sectionInputError = false;

    const sectionNodes = document.querySelectorAll('.edit-session-section-id');
    sectionNodes.forEach(node => {
        const sectionId = node.value;
        const priceEl = document.getElementById(`editModalSessionPrice_${sectionId}`);
        const ticketsEl = document.getElementById(`editModalSessionTickets_${sectionId}`);
        const venueSectionCapacity = parseInt(node.parentElement.querySelector('.edit-session-section-original-capacity').value); // Get original capacity

        if (!priceEl || !ticketsEl) {
            console.error(`Price or tickets element not found for section ${sectionId} in edit form`);
            sectionInputError = true; return;
        }

        const price = parseInt(priceEl.value);
        const ticketsAvailable = parseInt(ticketsEl.value);
        
        const venueSection = venue.seatMap.find(s => s.id === sectionId); // For name
        const sectionName = venueSection ? venueSection.name : sectionId;

        if (isNaN(price) || price < 0 || isNaN(ticketsAvailable) || ticketsAvailable < 0) {
            err.textContent = `區域 "${sectionName}" 的票價和票數必須是有效的非負數字。`;
            sectionInputError = true; return;
        }

        // Find original ticketsSold for this section to validate new ticketsAvailable
        const originalSectionData = sessionToUpdate.sections.find(s => s.sectionId === sectionId);
        const ticketsSold = originalSectionData ? originalSectionData.ticketsSold : 0;

        if (ticketsAvailable < ticketsSold) {
            err.textContent = `區域 "${sectionName}" 的可售票數 (${ticketsAvailable}) 不可少於已售票數 (${ticketsSold})。`;
            sectionInputError = true; return;
        }
        if (ticketsAvailable > venueSectionCapacity) { // Check against venue section's defined capacity
            err.textContent = `區域 "${sectionName}" 的可售票數 (${ticketsAvailable}) 不可超過該區域在場地圖中定義的容量 (${venueSectionCapacity})。`;
            sectionInputError = true; return;
        }
        
        updatedSectionsData.push({
            sectionId,
            price,
            ticketsAvailable,
            ticketsSold // Keep original ticketsSold
        });
    });

    if (sectionInputError) { err.style.display = 'block'; return; }

    // Ensure all sections from venue.seatMap are covered
    if (updatedSectionsData.length !== venue.seatMap.length) {
         let missingSections = venue.seatMap.filter(vs => !updatedSectionsData.find(us => us.sectionId === vs.id));
         err.textContent = `未能讀取所有場地區域的票務資訊。缺少的區域: ${missingSections.map(s=>s.name).join(', ')}。請檢查表單。`;
         err.style.display = 'block';
         return;
    }


    // Update session details
    sessionToUpdate.dateTime = dateTime;
    sessionToUpdate.salesStartDateTime = salesStartDateTime;
    sessionToUpdate.salesEndDateTime = salesEndDateTime;
    sessionToUpdate.sections = updatedSectionsData;

    em_saveDataCallback();
    msg.textContent = '場次更新成功！';
    msg.style.display = 'block';

    setTimeout(() => {
        em_uiHelpers.removeModal();
        // Use parentListContainer for refreshing the list
        renderEventListInternal(parentListContainer, rolePrefix === 'Admin' ? 'eventListAdmin' : 'eventListOrg', rolePrefix === 'Admin');
    }, 1500);
}
