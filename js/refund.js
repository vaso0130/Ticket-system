// Refund Module
import { createModal, removeModal } from './ui.js';

let appDataRef;
let saveDataCallbackRef;
let getCurrentUserCallbackRef;
let onRefundUpdateCallbackRef;

export function initRefundModule(data, saveDataFn, getCurrentUserFn, onUpdateCallback) {
    appDataRef = data;
    saveDataCallbackRef = saveDataFn;
    getCurrentUserCallbackRef = getCurrentUserFn;
    onRefundUpdateCallbackRef = onUpdateCallback;
}

// For User: Show modal to request a refund
export function handleShowRefundRequestModal(ticket, concert, session, refreshCb) { // ticket is a single ticket object
    // 公關票防呆
    if(ticket.paymentMethod === 'pr') {
        createModal('提示', `<div style='padding:1rem 0;'>公關票不可退票</div><div style='text-align:right;'><button id='modal-ok' style='background:#888;'>確定</button></div>`);
        setTimeout(() => {
            document.getElementById('modal-ok').onclick = () => {
                removeModal();
            };
        }, 0);
        return;
    }

    const modal = createModal();
    const venue = appDataRef.venues.find(v => v.id === concert.venueId);
    const venueName = venue ? venue.name : '未知場地';
    const sectionData = session.sections.find(sec => sec.sectionId === ticket.sectionId);
    const sectionName = venue && venue.seatMap && venue.seatMap.find(vs => vs.id === ticket.sectionId) ?
                        venue.seatMap.find(vs => vs.id === ticket.sectionId).name :
                        (sectionData ? sectionData.name : ticket.sectionId);
    const pricePerTicket = sectionData ? sectionData.price : 'N/A';

    modal.box.innerHTML = `
      <h3>申請退票</h3>
      <p>您確定要退訂以下票券嗎？</p>
      <div class="ticket-details-summary" style="background:#f9f9f9; padding:10px; border-radius:5px; margin-bottom:15px;">
        <strong>${concert.title}</strong><br/>
        票號: ${ticket.ticketId || ticket.id || '-'}<br/>
        場次: ${new Date(session.dateTime).toLocaleString()}<br/>
        場地: ${venueName} | 區域: ${sectionName}<br/>
        票價: NT$${pricePerTicket}
      </div>
      <p class="info">退票將依照相關規定處理，可能產生手續費。</p>
      <p id="refundError" class="error" style="display:none;"></p>
      <div style="margin-top:1rem; text-align:right;">
        <button id="cancelRefundBtn" style="margin-right:0.5rem; background:#888;">取消</button>
        <button id="confirmRefundBtn">確認退票</button>
      </div>
    `;

    modal.box.querySelector('#cancelRefundBtn').onclick = () => removeModal(modal.overlay);
    modal.box.querySelector('#confirmRefundBtn').onclick = () => {
        processRefundRequest(ticket, modal, refreshCb);
    };
}

function processRefundRequest(ticket, modal, refreshCb) { // ticket is a single ticket object
    const confirmBtn = modal.box.querySelector('#confirmRefundBtn');
    confirmBtn.disabled = true;
    confirmBtn.textContent = '處理中...';

    setTimeout(() => {
        const ticketToUpdate = appDataRef.tickets.find(t => (t.ticketId === ticket.ticketId || t.id === ticket.id));
        if (ticketToUpdate) {
            const purchaseTime = new Date(ticketToUpdate.purchaseTime).getTime();
            const now = Date.now();
            if (now - purchaseTime <= 3 * 60 * 1000) {
                ticketToUpdate.status = 'refunded';
                ticketToUpdate.refundTime = now;
                const concertData = appDataRef.concerts.find(c => c.id === (ticketToUpdate.concertId || ticketToUpdate.eventId));
                if (concertData) {
                    const sessionData = concertData.sessions.find(s => s.id === ticketToUpdate.sessionId || s.sessionId === ticketToUpdate.sessionId);
                    if (sessionData) {
                        const sectionData = sessionData.sections.find(sec => sec.sectionId === ticketToUpdate.sectionId);
                        if (sectionData) {
                            sectionData.ticketsSold = Math.max(0, sectionData.ticketsSold - 1);
                        }
                    }
                }
                saveDataCallbackRef();
                removeModal(modal.overlay);
                createModal('退票成功', `<p>票券 (ID: ${ticketToUpdate.ticketId || ticketToUpdate.id}) 已自動退票。</p>`, [{ text: '確定', onClick: () => { removeModal(); if (typeof refreshCb === 'function') refreshCb(); } }]);
            } else {
                ticketToUpdate.status = 'refund_pending';
                ticketToUpdate.refundRequestTime = now;
                saveDataCallbackRef();
                removeModal(modal.overlay);
                createModal('退票申請已送出', `<p>票券 (ID: ${ticketToUpdate.ticketId || ticketToUpdate.id}) 已提交退票申請，請等待審查。</p>`, [{ text: '確定', onClick: () => { removeModal(); if (typeof refreshCb === 'function') refreshCb(); } }]);
            }
            if (onRefundUpdateCallbackRef) {
                onRefundUpdateCallbackRef();
            }
        } else {
            console.error("Ticket not found for refund processing:", ticket.ticketId || ticket.id);
            const refundError = modal.box.querySelector('#refundError');
            refundError.textContent = '處理退票時發生錯誤，找不到票券。';
            refundError.style.display = 'block';
            confirmBtn.disabled = false;
            confirmBtn.textContent = '確認退票';
        }
    }, 1500);
}

// 共用：產生退票審查清單項目
export function createRefundReviewListItem(t, concerts, approveHandler, rejectHandler) {
    const concert = concerts.find(c => String(c.id) === String(t.concertId));
    // 取得座位資訊
    let seatInfo = '';
    if (t.seats && t.seats.length > 0) {
        seatInfo = t.seats.map(s => s.label || (s.row && s.seat ? `${s.row}排${s.seat}號` : s.description || '')).join(', ');
    }
    // 申請時間
    let applyTime = t.refundRequestTime ? new Date(t.refundRequestTime).toLocaleString() : '-';
    const li = document.createElement('li');
    li.innerHTML = `
    <div style="flex-grow:1;">
      <strong>${concert ? concert.title : t.concertId}</strong><br/>
      票號: ${t.ticketId || t.id || '-'}<br/>
      座位: ${seatInfo || '-'}<br/>
      申請人: ${t.username}<br/>
      申請日期: ${applyTime}
    </div>
  `;
    const approveBtn = document.createElement('button');
    approveBtn.className = 'small-btn';
    approveBtn.textContent = '同意';
    approveBtn.onclick = approveHandler;
    const rejectBtn = document.createElement('button');
    rejectBtn.className = 'small-btn';
    rejectBtn.style.background = '#888';
    rejectBtn.textContent = '拒絕';
    rejectBtn.onclick = rejectHandler;
    li.appendChild(approveBtn);
    li.appendChild(rejectBtn);
    return li;
}

// For Admin: Render UI for reviewing pending refunds
export function renderAdminRefundReviewUI(containerElementId) {
    const container = document.getElementById(containerElementId) || document.querySelector(containerElementId); // Allow ID or selector
    if (!container) {
        console.error("Refund review container not found with selector:", containerElementId);
        return;
    }
    container.innerHTML = `
    <h3>退票審核</h3>
    <ul class="tickets-list" id="refundListAdmin"></ul>
  `;
    const ul = container.querySelector('#refundListAdmin');
    if (!ul) {
        console.error("Admin refund list UL element not found within container.");
        return;
    }
    ul.innerHTML = '';
    const pendingRefunds = appDataRef.tickets.filter(t => t.status === 'refund_pending');
    if (pendingRefunds.length === 0) {
        ul.innerHTML = '<li>目前無待審核的退票申請。</li>';
        return;
    }
    pendingRefunds.forEach(t => {
        ul.appendChild(
            createRefundReviewListItem(
                t,
                appDataRef.concerts,
                () => {
                    t.status = 'refunded';
                    saveDataCallbackRef();
                    renderAdminRefundReviewUI(containerElementId);
                },
                () => {
                    t.status = 'normal';
                    saveDataCallbackRef();
                    renderAdminRefundReviewUI(containerElementId);
                }
            )
        );
    });
}
