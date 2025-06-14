import { createModal, removeModal } from './ui.js'; // Assuming ui.js is in the same directory
import { handleShowBuyTicketModal } from './ticketing.js'; // Import the ticketing function
import { handleShowRefundRequestModal } from './refund.js'; // Import refund modal function

let mainContentRef;
let appDataRef; 
// uiHelpersRef is not used by user module directly, createModal/removeModal are imported directly
let saveDataCallbackRef;
let getCurrentUserCallbackRef;

export function initUserModule(mainContentElement, data, saveDataFunc, getCurrentUserFunc) {
    mainContentRef = mainContentElement;
    appDataRef = data;
    saveDataCallbackRef = saveDataFunc;
    getCurrentUserCallbackRef = getCurrentUserFunc;
}

export function renderSpectatorDashboardUI() {
    if (!mainContentRef || !appDataRef || !saveDataCallbackRef || !getCurrentUserCallbackRef) {
        console.error("User module not initialized correctly.");
        mainContentRef.innerHTML = "<p>使用者模組載入失敗，請稍後再試。</p>";
        return;
    }
    mainContentRef.innerHTML = `
    <h2>觀眾專區</h2>
    <nav style="margin-bottom: 1rem;">
      <button id="spectatorConcertsBtn">演唱會列表</button>
      <button id="spectatorMyTicketsBtn">我的票券</button>
    </nav>
    <section id="spectatorContent"></section>
    `;

    const spectatorContentElement = mainContentRef.querySelector('#spectatorContent');

    const concertsBtn = mainContentRef.querySelector('#spectatorConcertsBtn');
    const myTicketsBtn = mainContentRef.querySelector('#spectatorMyTicketsBtn');

    if (concertsBtn) {
        concertsBtn.onclick = () => {
            if (spectatorContentElement) {
                renderConcertsForSpectator(spectatorContentElement);
            } else {
                console.error("Spectator content element not found for concerts button");
            }
        };
    }

    if (myTicketsBtn) {
        myTicketsBtn.onclick = () => {
            if (spectatorContentElement) {
                renderMyTickets(spectatorContentElement);
            } else {
                console.error("Spectator content element not found for my tickets button");
            }
        };
    }

    // Default view
    if (spectatorContentElement) {
        renderConcertsForSpectator(spectatorContentElement); // Default to showing concerts
    } else {
         console.error("Spectator content element not found for default render");
    }
}

// Show concerts with buy button if available
function renderConcertsForSpectator(containerElement) {
    const { venues, concerts } = appDataRef;
    containerElement.innerHTML = '<ul class="concert-list spectator-concert-list" id="spectatorConcertList"></ul>'; // Added spectator-concert-list class
    const ul = containerElement.querySelector('#spectatorConcertList');

    if (!ul) {
        console.error("Spectator concert list container not found in provided element");
        containerElement.innerHTML = '<p>演唱會列表載入失敗。</p>';
        return;
    }
    ul.innerHTML = '';
    const now = new Date();

    if (concerts.length === 0) {
        ul.innerHTML = '<li>目前沒有任何演唱會活動。</li>';
        return;
    }

    concerts.forEach(concert => {
        const venue = venues.find(v => v.id === concert.venueId);
        const venueName = venue ? venue.name : '未知場地';
        const concertDescription = concert.description || '無詳細描述';

        const concertLi = document.createElement('li');
        concertLi.className = 'concert-item-spectator'; // Add class for styling
        // concertLi.style.flexDirection = 'column'; // Removed inline style
        // concertLi.style.alignItems = 'flex-start'; // Removed inline style

        let concertImageHtml = '';
        if (concert.imageUrl) {
            concertImageHtml = `
                <img src="${concert.imageUrl}" alt="${concert.title}" class="concert-item-spectator-image">
            `;
        } else {
            concertImageHtml = '<div class="concert-item-spectator-image-placeholder">無圖片</div>';
        }

        const concertInfoDiv = document.createElement('div');
        concertInfoDiv.className = 'concert-item-spectator-info';
        concertInfoDiv.innerHTML = `
            <h4>${concert.title}</h4>
            <p class="venue-name">地點: ${venueName}</p>
            <p class="concert-description">${concertDescription}</p>
        `;

        const concertClickableDiv = document.createElement('div');
        concertClickableDiv.className = 'concert-item-clickable-area';
        concertClickableDiv.innerHTML = concertImageHtml;
        concertClickableDiv.appendChild(concertInfoDiv);

        const sessionsContainer = document.createElement('div');
        sessionsContainer.className = 'sessions-list-spectator';
        sessionsContainer.style.display = 'none'; // Initially hidden
        sessionsContainer.style.width = '100%';
        sessionsContainer.style.marginTop = '10px';

        concertClickableDiv.onclick = () => {
            const isVisible = sessionsContainer.style.display === 'block';
            sessionsContainer.style.display = isVisible ? 'none' : 'block';
            if (!isVisible && sessionsContainer.innerHTML === '') { // Lazy load sessions
                renderConcertSessions(sessionsContainer, concert, now);
            }
        };

        concertLi.appendChild(concertClickableDiv);
        concertLi.appendChild(sessionsContainer);
        ul.appendChild(concertLi);
    });
}

function renderConcertSessions(sessionsContainer, concert, now) {
    if (!concert.sessions || concert.sessions.length === 0) {
        sessionsContainer.innerHTML = '<p style="font-size:0.9em; color: #777;">此活動目前沒有場次。</p>';
    } else {
        concert.sessions.forEach(session => {
            const sessionStart = new Date(session.salesStartDateTime);
            const sessionEnd = new Date(session.salesEndDateTime);
            const sessionDateTime = new Date(session.dateTime);
            let onSale = now >= sessionStart && now <= sessionEnd;

            let totalTicketsLeftInSession = 0;
            if (session.sections && session.sections.length > 0) {
                session.sections.forEach(section => {
                    totalTicketsLeftInSession += (section.ticketsAvailable - section.ticketsSold);
                });
            }

            const sessionDiv = document.createElement('div');
            sessionDiv.className = 'session-item-spectator';
            // Removed inline styles, should be handled by CSS

            let sessionImageHtml = '';
            // Fallback to main event image if session image is not set or if session.sessionImageUrl is an empty string
            const imageUrlToDisplay = session.sessionImageUrl || concert.imageUrl;
            if (imageUrlToDisplay) {
                sessionImageHtml = `<img src="${imageUrlToDisplay}" alt="場次/活動圖片" class="session-item-image">`;
            }

            let sessionInfoHtml = `
                <div class="session-item-info-content">
                    ${sessionImageHtml}
                    <div>
                        <strong>場次: ${sessionDateTime.toLocaleString()}</strong><br>
                        <span class="session-sale-dates">售票期間: ${sessionStart.toLocaleDateString()} - ${sessionEnd.toLocaleDateString()}</span><br>
                        <span class="session-tickets-left">剩餘票數: ${totalTicketsLeftInSession}</span>
                    </div>
                </div>
            `;

            sessionDiv.innerHTML = sessionInfoHtml;

            const sessionActionsDiv = document.createElement('div');
            sessionActionsDiv.className = 'session-item-actions';

            if (onSale && totalTicketsLeftInSession > 0) {
                const buyBtn = document.createElement('button');
                buyBtn.textContent = '立即購票';
                buyBtn.className = 'small-btn buy-ticket-btn';
                buyBtn.onclick = (e) => { 
                    e.stopPropagation(); // Prevent concert item click event
                    handleShowBuyTicketModal(concert, session); 
                };
                sessionActionsDiv.appendChild(buyBtn);
            } else if (totalTicketsLeftInSession === 0) {
                const soldOut = document.createElement('span');
                soldOut.textContent = '已售完';
                soldOut.className = 'ticket-status-soldout';
                sessionActionsDiv.appendChild(soldOut);
            } else if (!onSale) {
                const notOnSale = document.createElement('span');
                notOnSale.textContent = (now < sessionStart) ? '尚未開賣' : '已截止售票';
                notOnSale.className = 'ticket-status-not-on-sale';
                sessionActionsDiv.appendChild(notOnSale);
            }
            sessionDiv.appendChild(sessionActionsDiv);
            sessionsContainer.appendChild(sessionDiv);
        });
    }
}

// Show user ticket list with refund button
function renderMyTickets(containerElement) {
    const { venues, concerts, tickets } = appDataRef;
    const currentUser = getCurrentUserCallbackRef();
    // const ul = mainContentRef.querySelector('#myTicketsList'); // Old way
    containerElement.innerHTML = '<ul class="tickets-list" id="myTicketsList"></ul>';
    const ul = containerElement.querySelector('#myTicketsList');

    if (!ul) {
        console.error("My tickets list container not found in provided element");
        containerElement.innerHTML = '<p>我的票券列表載入失敗。</p>';
        return;
    }
    ul.innerHTML = '';
    const myTickets = tickets.filter(t => t.username === currentUser.username);
    if (myTickets.length === 0) {
        ul.innerHTML = '<li>目前尚無票券</li>';
        return;
    }

    myTickets.forEach(t => { // t now represents a single ticket (quantity is 1)
        const concert = concerts.find(c => c.id === t.concertId);
        if (!concert) {
            console.warn(`Ticket found for non-existent concertId: ${t.concertId}`);
            return;
        }

        const session = concert.sessions.find(s => s.id === t.sessionId);
        if (!session) {
            console.warn(`Ticket found for non-existent sessionId: ${t.sessionId} in concertId: ${t.concertId}`);
            return;
        }

        // Debug: 印出票券狀態與場次時間
        console.log('票券debug', {
            id: t.id,
            status: t.status,
            sessionDateTime: session.dateTime
        });

        const venue = venues.find(v => v.id === concert.venueId);
        const venueName = venue ? venue.name : '未知場地';

        const sectionData = session.sections.find(sec => sec.sectionId === t.sectionId);
        const venueSectionInfo = venue && venue.seatMap ? venue.seatMap.find(vs => vs.id === t.sectionId) : null;
        const sectionName = venueSectionInfo ? venueSectionInfo.name : (sectionData ? sectionData.name : t.sectionId);
        const pricePerTicket = sectionData ? sectionData.price : 'N/A';

        let statusDisplay = '';
        if (t.status === 'refund_pending') {
            statusDisplay = `<div class="info" style="color:#e67e22;">狀態：退票審核中</div>`;
        } else if (t.status === 'refunded') {
            statusDisplay = `<div class="info" style="color:#009688;">狀態：已退款</div>`;
        } else if (t.status === 'normal') {
            // statusDisplay = `<div class="info" style="color:green;">狀態：正常</div>`; // Optionally show normal status
        }


        const li = document.createElement('li');
        li.className = 'my-ticket-item'; // Added class for potential styling
        li.style.display = 'flex';
        li.style.justifyContent = 'space-between';
        li.style.alignItems = 'center';

        // Determine how to display seat information
        let seatDisplay = '';
        if (t.seats && t.seats.length > 0) {
            // Check if the first element in seats is an object or a string/number
            if (typeof t.seats[0] === 'object' && t.seats[0] !== null) {
                // Assuming seats are objects like { row: 'A', seat: 1 }
                // This case should ideally not happen for 'generalAdmission' if data is consistent
                seatDisplay = t.seats.map(s => `${s.row || ''}${s.seat || ''}`).join(', '); 
            } else {
                // Seats are likely strings or numbers (e.g., ['A1', 'A2'] or ['自由入座'])
                seatDisplay = t.seats.join(', ');
            }
        }
        // For general admission, explicitly state it if no specific seats are listed or if it's marked as such
        const isGeneralAdmission = venueSectionInfo && (venueSectionInfo.seatingType === 'generalAdmission' || venueSectionInfo.seatingType === 'general');
        if (isGeneralAdmission && (!t.seats || t.seats.length === 0)) {
            seatDisplay = '自由入座';
        } else if (isGeneralAdmission && t.seats && t.seats.length > 0 && seatDisplay.includes('[object Object]')) {
            // Fallback if it's general admission but somehow seats are complex objects
            seatDisplay = '自由入座 (多張)';
        }


        li.innerHTML = `
        <div style="flex-grow:1;">
          <strong>${concert.title}</strong> (票號: ${t.id})<br/>
          場次: ${new Date(session.dateTime).toLocaleString()}<br/>
          場地: ${venueName} | 區域: ${sectionName}<br/>
          票價: NT$${pricePerTicket}
          ${seatDisplay ? `<br/>座位: ${seatDisplay}` : ''}
          ${statusDisplay}
        </div>
      `;

        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'ticket-actions'; // Added class for styling

        // 計算是否距離場次開始小於3天
        const now = new Date();
        const sessionDate = new Date(session.dateTime);
        const diffTime = sessionDate - now;
        const diffDays = diffTime / (1000 * 60 * 60 * 24);

        if (t.status === 'normal' || t.status === 'confirmed') {
            const refundBtn = document.createElement('button');
            refundBtn.className = 'small-btn refund-button';
            refundBtn.textContent = '申請退票';

            // 計算是否距離場次開始小於3天
            const now = new Date();
            const sessionDate = new Date(session.dateTime);
            const diffTime = sessionDate - now;
            const diffDays = diffTime / (1000 * 60 * 60 * 24);
            if (diffDays < 3) {
                refundBtn.disabled = true;
                refundBtn.style.background = '#ccc';
                refundBtn.style.color = '#888';
                refundBtn.title = '演唱會開始前3天內不可退票';
            } else {
                refundBtn.onclick = () => handleShowRefundRequestModal(t, concert, session, () => renderMyTickets(containerElement));
            }
            actionsDiv.appendChild(refundBtn);
        }

        // 退票按鈕：永遠顯示，不能退時灰白且提示
        const canRefund = (t.status === 'normal' || t.status === 'confirmed') && diffDays >= 3;
        const refundBtn = document.createElement('button');
        refundBtn.className = 'small-btn refund-button';
        refundBtn.textContent = '申請退票';
        if (!canRefund) {
            refundBtn.style.background = '#ccc';
            refundBtn.style.color = '#888';
            refundBtn.title = '退票時間已過，請洽詢管理員';
            refundBtn.onclick = () => {
                createModal('提示', `\
                  <div style='padding:1rem 0;'>未開放，請洽詢管理員</div>\
                  <div style='text-align:right;'><button id='modal-ok' style='background:#888;'>確定</button></div>\
                `);
                setTimeout(() => {
                  document.getElementById('modal-ok').onclick = () => {
                    import('./ui.js').then(mod => mod.removeModal());
                  };
                }, 0);
            };
        } else {
            refundBtn.onclick = () => handleShowRefundRequestModal(t, concert, session, () => renderMyTickets(containerElement));
        }
        actionsDiv.appendChild(refundBtn);

        // 領票按鈕：永遠顯示，不能領時灰白且提示
        const canClaim = (diffDays < 3 && (t.status === 'normal' || t.status === 'confirmed'));
        const claimBtn = document.createElement('button');
        claimBtn.className = 'small-btn claim-ticket-btn';
        claimBtn.textContent = '領票';
        if (!canClaim) {
            claimBtn.style.background = '#ccc';
            claimBtn.style.color = '#888';
            claimBtn.title = '未開放，請洽詢管理員';
            claimBtn.onclick = () => {
                createModal('提示', `\
                  <div style='padding:1rem 0;'>活動前三天開放領取，請洽詢管理員</div>\
                  <div style='text-align:right;'><button id='modal-ok' style='background:#888;'>確定</button></div>\
                `);
                setTimeout(() => {
                  document.getElementById('modal-ok').onclick = () => {
                    import('./ui.js').then(mod => mod.removeModal());
                  };
                }, 0);
            };
        } else {
            claimBtn.onclick = () => {
                createModal('選擇領票方式', `\
                  <div style='display:flex; gap:0.5rem; margin-bottom:0.5rem;'>\
                    <button id='claim-physical'>實體票券</button>\
                    <button id='claim-qr'>QR電子票券</button>\
                  </div>\
                  <div id='claim-result'></div>\
                  <div style='margin-top:1rem; text-align:right; display:flex; justify-content:flex-end; gap:0.5rem;'>\
                    <button id='claim-cancel' style='background:#888;'>取消</button>\
                  </div>\
                `);
                setTimeout(() => {
                  document.getElementById('claim-physical').onclick = () => {
                    const code = 'PX' + Math.random().toString(36).substr(2, 8).toUpperCase();
                    document.getElementById('claim-result').innerHTML = `<p>請持代碼 <b>${code}</b> 至超商領取實體票券</p>`;
                  };
                  document.getElementById('claim-qr').onclick = () => {
                    document.getElementById('claim-result').innerHTML = `<p>QR電子票券將於演唱會前一小時開放領取</p>`;
                  };
                  document.getElementById('claim-cancel').onclick = () => {
                    import('./ui.js').then(mod => mod.removeModal());
                  };
                }, 0);
            };
        }
        actionsDiv.appendChild(claimBtn);

        li.appendChild(actionsDiv);
        ul.appendChild(li);
    });
}
