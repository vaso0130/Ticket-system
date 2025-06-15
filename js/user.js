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
    <section>
      <h3>演唱會列表</h3>
      <ul class="concert-list" id="spectatorConcertList"></ul>
    </section>
    <section style="margin-top: 2rem;">
      <h3>我的票券</h3>
      <ul class="tickets-list" id="myTicketsList"></ul>
    </section>
    `;
    renderConcertsForSpectator();
    renderMyTickets();
}

// Show concerts with buy button if available
function renderConcertsForSpectator() {
    const { venues, concerts } = appDataRef;
    const ul = mainContentRef.querySelector('#spectatorConcertList');
    if (!ul) {
        console.error("Spectator concert list container not found");
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

        const concertLi = document.createElement('li');
        concertLi.style.flexDirection = 'column'; // Allow sessions to stack vertically
        concertLi.style.alignItems = 'flex-start'; // Align items to the start

        let concertHeaderHtml = `
            <div style="width:100%;">
                <h4 style="margin-bottom: 0.5rem;">${concert.title}</h4>
                <p style="font-size:0.9em; color:#555; margin-top:0;">地點: ${venueName}</p>
            </div>
        `;
        if (concert.imageUrl) {
            concertHeaderHtml = `
            <div style="display: flex; align-items: center; width:100%; margin-bottom:10px;">
                <img src="${concert.imageUrl}" alt="${concert.title}" style="width: 100px; height: 75px; object-fit: cover; margin-right: 15px; border-radius: 5px;">
                <div style="flex-grow:1;">
                    <h4 style="margin-bottom: 0.2rem;">${concert.title}</h4>
                    <p style="font-size:0.9em; color:#555; margin-top:0;">地點: ${venueName}</p>
                </div>
            </div>
            `;
        }

        const sessionsContainer = document.createElement('div');
        sessionsContainer.className = 'sessions-list-spectator';
        sessionsContainer.style.width = '100%';
        sessionsContainer.style.marginTop = '10px';

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
                sessionDiv.style.padding = '10px';
                sessionDiv.style.border = '1px solid #eee';
                sessionDiv.style.borderRadius = 'var(--border-radius)';
                sessionDiv.style.marginBottom = '10px';
                sessionDiv.style.display = 'flex';
                sessionDiv.style.justifyContent = 'space-between';
                sessionDiv.style.alignItems = 'center';

                let sessionImageHtml = '';
                if (session.sessionImageUrl) {
                    sessionImageHtml = `<img src="${session.sessionImageUrl}" alt="場次圖片" style="width: 80px; height: 60px; object-fit: cover; margin-right: 10px; border-radius: 3px;">`;
                } else if (concert.imageUrl && !session.sessionImageUrl) { // Fallback to main event image if session image is not set
                    sessionImageHtml = `<img src="${concert.imageUrl}" alt="活動圖片" style="width: 80px; height: 60px; object-fit: cover; margin-right: 10px; border-radius: 3px;">`;
                }

                let sessionInfoHtml = `
                    <div style="flex-grow: 1; display:flex; align-items:center;">
                        ${sessionImageHtml}
                        <div>
                            <strong>場次: ${sessionDateTime.toLocaleString()}</strong><br>
                            <span style="font-size:0.85em;">售票期間: ${sessionStart.toLocaleDateString()} - ${sessionEnd.toLocaleDateString()}</span><br>
                            <span style="font-size:0.85em;">剩餘票數: ${totalTicketsLeftInSession}</span>
                        </div>
                    </div>
                `;

                sessionDiv.innerHTML = sessionInfoHtml;

                if (onSale && totalTicketsLeftInSession > 0) {
                    const buyBtn = document.createElement('button');
                    buyBtn.textContent = '立即購票';
                    buyBtn.className = 'small-btn';
                    buyBtn.onclick = () => handleShowBuyTicketModal(concert, session);
                    sessionDiv.appendChild(buyBtn);
                } else if (totalTicketsLeftInSession === 0) {
                    const soldOut = document.createElement('span');
                    soldOut.textContent = '已售完';
                    soldOut.style.color = '#e53935';
                    soldOut.style.fontWeight = '600';
                    soldOut.style.marginLeft = '0.5rem';
                    sessionDiv.appendChild(soldOut);
                } else if (!onSale) {
                    const notOnSale = document.createElement('span');
                    notOnSale.textContent = (now < sessionStart) ? '尚未開賣' : '已截止售票';
                    notOnSale.style.color = '#777';
                    notOnSale.style.fontWeight = '600';
                    notOnSale.style.marginLeft = '0.5rem';
                    sessionDiv.appendChild(notOnSale);
                }
                sessionsContainer.appendChild(sessionDiv);
            });
        }
        concertLi.innerHTML = concertHeaderHtml;
        concertLi.appendChild(sessionsContainer);
        ul.appendChild(concertLi);
    });
}

// Show user ticket list with refund button
function renderMyTickets() {
    const { venues, concerts, tickets } = appDataRef;
    const currentUser = getCurrentUserCallbackRef();
    const ul = mainContentRef.querySelector('#myTicketsList');
    if (!ul) {
        console.error("My tickets list container not found");
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
        li.innerHTML = `
        <div style="flex-grow:1;">
          <strong>${concert.title}</strong> (票號: ${t.id})<br/>
          場次: ${new Date(session.dateTime).toLocaleString()}<br/>
          場地: ${venueName} | 區域: ${sectionName}<br/>
          票價: NT$${pricePerTicket}
          ${statusDisplay}
        </div>
      `;
        if (t.status === 'normal') {
            const refundBtn = document.createElement('button');
            refundBtn.className = 'small-btn';
            refundBtn.textContent = '申請退票';
            refundBtn.onclick = () => {
                handleShowRefundRequestModal(t, concert, session);
            };
            li.appendChild(refundBtn);
        }
        ul.appendChild(li);
    });
}
