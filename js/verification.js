// Ticket verification module
let appDataRef;
let saveDataCallbackRef;

export function initVerificationModule(data, saveDataFunc) {
    appDataRef = data;
    saveDataCallbackRef = saveDataFunc;
}

export function renderVerificationUI(containerElement) {
    if (!containerElement || !appDataRef) return;
    containerElement.innerHTML = `
      <h3>票券驗證</h3>
      <div style="margin-bottom:1rem;">
        <input type="text" id="verifyTicketId" placeholder="輸入票號" />
        <button id="verifyTicketBtn" class="small-btn" style="margin-left:0.5rem;">驗證</button>
      </div>
      <div id="verifyResult"></div>
    `;
    const btn = containerElement.querySelector('#verifyTicketBtn');
    btn.onclick = () => {
        const ticketId = containerElement.querySelector('#verifyTicketId').value.trim();
        const result = containerElement.querySelector('#verifyResult');
        if (!ticketId) {
            result.textContent = '請輸入票號';
            return;
        }
        const ticket = appDataRef.tickets.find(t => String(t.ticketId) === ticketId);
        if (!ticket) {
            result.textContent = '查無此票券';
            return;
        }
        if (ticket.status === 'used') {
            result.textContent = '此票券已使用';
            return;
        }
        if (ticket.status !== 'confirmed' && ticket.status !== 'normal') {
            result.textContent = '此票券狀態無法驗證';
            return;
        }
        ticket.status = 'used';
        ticket.verifyTime = new Date().toISOString();
        if (saveDataCallbackRef) saveDataCallbackRef();
        result.textContent = `票券驗證成功，持票人: ${ticket.username}`;
    };
}

