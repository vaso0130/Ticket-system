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

export function renderSpectatorDashboardUI(defaultTab = 'concerts') {
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
        if (defaultTab === 'myTickets') {
            renderMyTickets(spectatorContentElement);
        } else {
            renderConcertsForSpectator(spectatorContentElement);
        }
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
    // 排序與隱藏選項全部壓成一行，label 文字不換行
    containerElement.innerHTML = `
      <div style="margin-bottom:1rem;display:flex;align-items:center;gap:1.5rem;flex-wrap:wrap;">
        <div style="display:flex;align-items:center;gap:0.5rem;white-space:nowrap;">
          <label style="margin:0;white-space:nowrap;">排序：</label>
          <select id="ticketSortSelect" style="height:2em;">
            <option value="purchaseTime">依購買時間</option>
            <option value="eventTime">依演唱會時間</option>
          </select>
          <button id="ticketSortOrderBtn" title="切換排序方向" style="font-size:1.2em;padding:0 0.5em;cursor:pointer;line-height:1.5;background:#009688;color:#fff;border-radius:4px;border:none;transition:background 0.2s;">▼</button>
        </div>
        <label style="display:flex;align-items:center;user-select:none;cursor:pointer;margin:0;gap:0.5em;white-space:nowrap;">
          <span>隱藏已使用/已退款</span><input type="checkbox" id="hideUsedRefunded" style="margin-left:0.5em;transform:scale(1.2);">
        </label>
      </div>
      <ul class="tickets-list" id="myTicketsList"></ul>
    `;
    const ul = containerElement.querySelector('#myTicketsList');
    const sortSelect = containerElement.querySelector('#ticketSortSelect');
    const sortOrderBtn = containerElement.querySelector('#ticketSortOrderBtn');
    const hideUsedRefunded = containerElement.querySelector('#hideUsedRefunded');
    let sortOrder = 'desc'; // 預設降序

    function renderList() {
      ul.innerHTML = '';
      let myTickets = tickets.filter(t => t.username === currentUser.username && t.concertId !== undefined);
      if (hideUsedRefunded.checked) {
        myTickets = myTickets.filter(t => t.status !== 'used' && t.status !== 'refunded');
      }
      // 排序
      const order = sortOrder === 'asc' ? 1 : -1;
      if (sortSelect.value === 'purchaseTime') {
        myTickets.sort((a, b) => (new Date(a.purchaseTime) - new Date(b.purchaseTime)) * order);
      } else if (sortSelect.value === 'eventTime') {
        myTickets.sort((a, b) => {
          const ca = concerts.find(c => c.id === a.concertId);
          const cb = concerts.find(c => c.id === b.concertId);
          const sa = ca && ca.sessions.find(s => s.sessionId === a.sessionId);
          const sb = cb && cb.sessions.find(s => s.sessionId === b.sessionId);
          return (new Date((sa && sa.dateTime) || 0) - new Date((sb && sb.dateTime) || 0)) * order;
        });
      }
      if (myTickets.length === 0) {
        ul.innerHTML = '<li>目前尚無票券</li>';
        return;
      }
      myTickets.forEach(t => {
        const concert = concerts.find(c => c.id === t.concertId);
        if (!concert) return;
        const session = concert.sessions.find(s => s.sessionId === t.sessionId);
        if (!session) return;
        const venue = venues.find(v => v.id === concert.venueId);
        const venueName = venue ? venue.name : '未知場地';
        const sectionData = session.sections.find(sec => sec.sectionId === t.sectionId);
        const venueSectionInfo = venue && venue.seatMap ? venue.seatMap.find(vs => vs.id === t.sectionId) : null;
        const sectionName = venueSectionInfo ? venueSectionInfo.name : (sectionData ? sectionData.name : t.sectionId);
        const pricePerTicket = sectionData ? sectionData.price : 'N/A';
        let statusDisplay = '';
        if (t.status === 'refund_pending') {
            statusDisplay = `<div class=\"info\" style=\"color:#e67e22;\">狀態：退票審核中</div>`;
        } else if (t.status === 'refunded') {
            statusDisplay = `<div class=\"info\" style=\"color:#009688;\">狀態：已退款</div>`;
        } else if (t.status === 'used') {
            statusDisplay = `<div class=\"info\" style=\"color:#c0392b;\">狀態：已使用</div>`;
        }
        // Determine how to display seat information
        let seatDisplay = '';
        const isGeneralAdmission = venueSectionInfo && (venueSectionInfo.seatingType === 'generalAdmission' || venueSectionInfo.seatingType === 'general');
        if (isGeneralAdmission) {
            seatDisplay = '自由入座';
        } else if (t.seats && t.seats.length > 0) {
            seatDisplay = t.seats.map(s => {
                if (typeof s === 'object' && s.row && s.seat) {
                    return `${s.row}排${s.seat}號`;
                } else if (typeof s === 'object' && s.label) {
                    return s.label;
                } else {
                    return s.toString();
                }
            }).join(', ');
        }
        if (isGeneralAdmission && (!t.seats || t.seats.length === 0)) {
            seatDisplay = '自由入座';
        } else if (isGeneralAdmission && t.seats && t.seats.length > 0 && seatDisplay.includes('[object Object]')) {
            seatDisplay = '自由入座 (多張)';
        }
        const ticketNo = `${t.sessionId}-${t.ticketId || t.id || ''}`;
        const li = document.createElement('li');
        li.className = 'my-ticket-item';
        li.style.display = 'flex';
        li.style.justifyContent = 'space-between';
        li.style.alignItems = 'center';
        li.innerHTML = `
        <div style=\"flex-grow:1;\">
          <strong>${concert.title}</strong> (票號: ${ticketNo})<br/>
          場次: ${new Date(session.dateTime).toLocaleString()}<br/>
          場地: ${venueName} | 區域: ${sectionName}<br/>
          票價: NT$${pricePerTicket}
          ${seatDisplay ? `<br/>座位: ${seatDisplay}` : ''}
          ${statusDisplay}
        </div>
      `;
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'ticket-actions';
        const now = new Date();
        const sessionDate = new Date(session.dateTime);
        const diffTime = sessionDate - now;
        const diffDays = diffTime / (1000 * 60 * 60 * 24);
        const isPRTicket = t.paymentMethod === 'pr';
        const canRefund = !isPRTicket && (t.status === 'normal' || t.status === 'confirmed') && diffDays >= 3;
        const refundBtn = document.createElement('button');
        refundBtn.className = 'small-btn refund-button';
        refundBtn.textContent = '申請退票';
        if (isPRTicket) {
            refundBtn.style.background = '#ccc';
            refundBtn.style.color = '#888';
            refundBtn.title = '公關票不可退票';
            refundBtn.onclick = () => {
                createModal('提示', `<div style='padding:1rem 0;'>公關票不可退票</div><div style='text-align:right;'><button id='modal-ok' style='background:#888;'>確定</button></div>`);
                setTimeout(() => {
                  document.getElementById('modal-ok').onclick = () => {
                    import('./ui.js').then(mod => mod.removeModal());
                  };
                }, 0);
            };
        } else if (!canRefund) {
            refundBtn.style.background = '#ccc';
            refundBtn.style.color = '#888';
            refundBtn.title = '退票時間已過，請洽詢管理員';
            refundBtn.onclick = () => {
                createModal('提示', `<div style='padding:1rem 0;'>退票時間已過，請恰管理員!</div><div style='text-align:right;'><button id='modal-ok' style='background:#888;'>確定</button></div>`);
                setTimeout(() => {
                  document.getElementById('modal-ok').onclick = () => {
                    import('./ui.js').then(mod => mod.removeModal());
                  };
                }, 0);
            };
        } else {
            refundBtn.onclick = () => handleShowRefundRequestModal(t, concert, session, () => renderSpectatorDashboardUI('myTickets'));
        }
        actionsDiv.appendChild(refundBtn);
        const canClaim = (diffDays < 3 && diffDays >= 0 && (t.status === 'normal' || t.status === 'confirmed'));
        const claimBtn = document.createElement('button');
        claimBtn.className = 'small-btn claim-ticket-btn';
        claimBtn.textContent = '領票';
        if (t.status === 'used') {
            claimBtn.style.background = '#ccc';
            claimBtn.style.color = '#888';
            claimBtn.title = '本票券已經使用，請洽詢工作人員。';
            claimBtn.onclick = () => {
                createModal('提示', `<div style='padding:1rem 0;'>本票券已經使用，請洽詢工作人員。</div><div style='text-align:right;'><button id='modal-ok' style='background:#888;'>確定</button></div>`);
                setTimeout(() => {
                  document.getElementById('modal-ok').onclick = () => {
                    import('./ui.js').then(mod => mod.removeModal());
                  };
                }, 0);
            };
        } else if (!canClaim) {
            claimBtn.style.background = '#ccc';
            claimBtn.style.color = '#888';
            claimBtn.title = '僅限演唱會前三天可領票';
            claimBtn.onclick = () => {
                createModal('提示', `<div style='padding:1rem 0;'>僅限演唱會前三天可領票與取得 QR Code</div><div style='text-align:right;'><button id='modal-ok' style='background:#888;'>確定</button></div>`);
                setTimeout(() => {
                  document.getElementById('modal-ok').onclick = () => {
                    import('./ui.js').then(mod => mod.removeModal());
                  };
                }, 0);
            };
        } else {
            claimBtn.onclick = () => {
                createModal('選擇領票方式', `<div style='display:flex; gap:0.5rem; margin-bottom:0.5rem;'><button id='claim-physical'>實體票券</button><button id='claim-qr'>QR電子票券</button></div><div id='claim-result'></div><div style='margin-top:1rem; text-align:right; display:flex; justify-content:flex-end; gap:0.5rem;'><button id='claim-cancel' style='background:#888;'>取消</button></div>`);
                setTimeout(() => {
                  document.getElementById('claim-physical').onclick = () => {
                    const code = 'PX' + Math.random().toString(36).substr(2, 8).toUpperCase();
                    document.getElementById('claim-result').innerHTML = `<p>請持代碼 <b>${code}</b> 至超商領取實體票券</p>`;
                  };
                  document.getElementById('claim-qr').onclick = () => {
                    const qrCanvas = document.createElement('canvas');
                    const data = `ticket:${t.ticketId}`;
                    QRCode.toCanvas(qrCanvas, data, { width: 180 }, function (error) {
                      if (error) {
                        document.getElementById('claim-result').innerHTML = '<p>無法產生 QR Code</p>';
                      } else {
                        const result = document.getElementById('claim-result');
                        result.innerHTML = '';
                        result.appendChild(qrCanvas);
                      }
                    });
                  };
                  document.getElementById('claim-cancel').onclick = () => {
                    import('./ui.js').then(mod => mod.removeModal());
                  };
                }, 0);
            };
        }
        actionsDiv.appendChild(claimBtn);
        const canTransfer = !isPRTicket && (t.status === 'normal' || t.status === 'confirmed');
        if (canTransfer) {
            const transferBtn = document.createElement('button');
            transferBtn.className = 'small-btn transfer-button';
            transferBtn.textContent = '轉移';
            transferBtn.onclick = () => handleShowTransferTicketModal(t, () => renderMyTickets(containerElement));
            actionsDiv.appendChild(transferBtn);
        } else if (isPRTicket) {
            const transferBtn = document.createElement('button');
            transferBtn.className = 'small-btn transfer-button';
            transferBtn.textContent = '轉移';
            transferBtn.style.background = '#ccc';
            transferBtn.style.color = '#888';
            transferBtn.title = '公關票不可轉移';
            transferBtn.onclick = () => {
                createModal('提示', `<div style='padding:1rem 0;'>公關票不可轉移</div><div style='text-align:right;'><button id='modal-ok' style='background:#888;'>確定</button></div>`);
                setTimeout(() => {
                  document.getElementById('modal-ok').onclick = () => {
                    import('./ui.js').then(mod => mod.removeModal());
                  };
                }, 0);
            };
            actionsDiv.appendChild(transferBtn);
        }
        li.appendChild(actionsDiv);
        ul.appendChild(li);
      });
    }
    sortSelect.onchange = renderList;
    hideUsedRefunded.onchange = renderList;
    sortOrderBtn.onclick = () => {
      sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
      sortOrderBtn.textContent = sortOrder === 'asc' ? '▲' : '▼';
      renderList();
    };
    // 初始化箭頭
    sortOrderBtn.textContent = sortOrder === 'asc' ? '▲' : '▼';
    renderList();
}

function handleShowTransferTicketModal(ticket, refreshCb) {
    const ticketNo = ticket && ticket.ticketId ? ticket.ticketId : '';
    const ticketInfoText = ticketNo ? `將票券 ${ticketNo} 轉移給哪個帳號？` : '將票券轉移給哪個帳號？';
    const modal = createModal('轉移票券', `\
      <p>${ticketInfoText}</p>\
      <input type="text" id="transferToUser" placeholder="輸入對方帳號">\
      <p id="transferError" class="error" style="display:none;"></p>\
      <div style='margin-top:1rem; text-align:right;'>\
        <button id='transferCancel' style='margin-right:0.5rem; background:#888;'>取消</button>\
        <button id='transferConfirm'>確認</button>\
      </div>`);
    modal.box.querySelector('#transferCancel').onclick = () => removeModal(modal.overlay);
    modal.box.querySelector('#transferConfirm').onclick = () => {
        const targetUser = modal.box.querySelector('#transferToUser').value.trim();
        const err = modal.box.querySelector('#transferError');
        if (!targetUser) {
            err.textContent = '請輸入帳號';
            err.style.display = 'block';
            return;
        }
        // 只允許轉移給 roles 包含 'spectator' 的帳號
        const userExists = appDataRef.users.find(u => u.username === targetUser && u.roles && u.roles.includes('spectator'));
        if (!userExists) {
            err.textContent = '帳號不存在或非一般觀眾帳號';
            err.style.display = 'block';
            return;
        }
        const t = appDataRef.tickets.find(ti => ti.ticketId === ticket.ticketId);
        if (t) t.username = targetUser;
        saveDataCallbackRef();
        removeModal(modal.overlay);
        if (refreshCb) refreshCb();
        createModal('完成', '<p>票券已成功轉移。</p>', [{ text: '確定', onClick: () => removeModal() }]);
    };
}

