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
export function handleShowRefundRequestModal(ticket, concert, session) { // ticket is a single ticket object
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
        票號: ${ticket.id}<br/>
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
        processRefundRequest(ticket, modal);
    };
}

function processRefundRequest(ticket, modal) { // ticket is a single ticket object
    const confirmBtn = modal.box.querySelector('#confirmRefundBtn');
    confirmBtn.disabled = true;
    confirmBtn.textContent = '處理中...';

    setTimeout(() => {
        const ticketToUpdate = appDataRef.tickets.find(t => t.id === ticket.id);
        if (ticketToUpdate) {
            ticketToUpdate.status = 'refund_pending';
            ticketToUpdate.refundRequestTime = Date.now(); // Add a timestamp for the request

            saveDataCallbackRef();
            alert(`票券 (ID: ${ticket.id}) 已提交退票申請。`);
            removeModal(modal.overlay);
            if (onRefundUpdateCallbackRef) {
                onRefundUpdateCallbackRef(); // Refresh UI
            }
        } else {
            console.error("Ticket not found for refund processing:", ticket.id);
            const refundError = modal.box.querySelector('#refundError');
            refundError.textContent = '處理退票時發生錯誤，找不到票券。';
            refundError.style.display = 'block';
            confirmBtn.disabled = false;
            confirmBtn.textContent = '確認退票';
        }
    }, 1500);
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
        const concert = appDataRef.concerts.find(c => c.id === t.concertId);
        if (!concert) {
            console.warn(`Concert not found for ticket during refund review: ${t.concertId}`);
            return; 
        }

        const li = document.createElement('li');
        li.innerHTML = `
        <div style="flex-grow:1;">
          <strong>${concert.title}</strong><br/>
          申請人: ${t.username}<br/>
          申請退票數量: ${t.refundRequest} 張 (原持有 ${t.quantity} 張，申請退 ${t.refundRequest} 張)
        </div>
      `;
        const approveBtn = document.createElement('button');
        approveBtn.className = 'small-btn';
        approveBtn.textContent = '同意';
        approveBtn.onclick = () => {
            // It is assumed t.quantity is the current holding, and t.refundRequest is the amount to be refunded.
            // If approved, the user will have (t.quantity - t.refundRequest) tickets left for this concert entry.
            // The concert's ticketsSold should also be decremented by t.refundRequest.

            const concertData = appDataRef.concerts.find(c => c.id === t.concertId);
            if (concertData) {
                concertData.ticketsSold -= t.refundRequest;
                if (concertData.ticketsSold < 0) concertData.ticketsSold = 0;
            }

            t.quantity -= t.refundRequest; // Reduce the number of tickets the user holds for this specific ticket entry

            if (t.quantity <= 0) { // If all tickets for this entry are refunded
                const idx = appDataRef.tickets.findIndex(ticket => 
                    ticket.username === t.username && 
                    ticket.concertId === t.concertId && 
                    ticket.purchaseTime === t.purchaseTime && // Assuming purchaseTime helps identify unique ticket entries
                    ticket.status === 'refund_pending' // Ensure we are removing the correct pending entry
                );
                if (idx !== -1) appDataRef.tickets.splice(idx, 1);
            } else { // If some tickets remain for this entry
                t.status = 'normal'; // Ticket status back to normal
                delete t.refundRequest; // Clear the refund request quantity
            }
            saveDataCallbackRef();
            if (onRefundUpdateCallbackRef) onRefundUpdateCallbackRef('admin'); // Refresh admin UI
        };

        const rejectBtn = document.createElement('button');
        rejectBtn.className = 'small-btn';
        rejectBtn.style.background = '#888';
        rejectBtn.textContent = '拒絕';
        rejectBtn.onclick = () => {
            t.status = 'normal';
            delete t.refundRequest;
            saveDataCallbackRef();
            if (onRefundUpdateCallbackRef) onRefundUpdateCallbackRef('admin'); // Refresh admin UI
        };
        li.appendChild(approveBtn);
        li.appendChild(rejectBtn);
        ul.appendChild(li);
    });
}
