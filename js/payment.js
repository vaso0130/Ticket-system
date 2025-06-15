// Payment Module
import { removeModal } from './ui.js'; // Assuming ui.js is in the same directory

let appDataRef;
let saveDataCallbackRef;
let getCurrentUserCallbackRef;

export function initPaymentModule(data, saveDataFunc, getCurrentUserFunc) {
    appDataRef = data;
    saveDataCallbackRef = saveDataFunc;
    getCurrentUserCallbackRef = getCurrentUserFunc;
}

export function processCreditCardPayment(modal, paymentDetails, onPurchaseSuccessCallbackRef) {
    const cardNumRaw = modal.box.querySelector('#cardNumUser').value;
    const cardNum = cardNumRaw.replace(/\D/g, ''); // Remove non-digits for validation
    const cardExp = modal.box.querySelector('#cardExpUser').value.trim();
    const cardCVC = modal.box.querySelector('#cardCVCUser').value.trim();
    const buyError = modal.box.querySelector('#buyErrorUser'); // Assuming buyError is still in the modal from ticketing.js
    const confirmBtn = modal.box.querySelector('#confirmBtnUser');


    if (!/^\d{16}$/.test(cardNum)) {
        buyError.textContent = '請輸入正確的16位數信用卡號';
        buyError.style.display = 'block';
        confirmBtn.disabled = false;
        confirmBtn.textContent = '確定購買';
        return;
    }
    if (!new RegExp("^\\d{2}/\\d{2}$").test(cardExp)) {
        buyError.textContent = '請輸入正確的有效期限 (MM/YY)';
        buyError.style.display = 'block';
        confirmBtn.disabled = false;
        confirmBtn.textContent = '確定購買';
        return;
    }
    if (!/^\d{3}$/.test(cardCVC)) {
        buyError.textContent = '請輸入正確的安全碼';
        buyError.style.display = 'block';
        confirmBtn.disabled = false;
        confirmBtn.textContent = '確定購買';
        return;
    }

    modal.box.innerHTML = `
      <h3>信用卡 3D 驗證</h3>
      <p>請輸入您的銀行發送的 OTP 驗證碼。</p>
      <label for="otpCodeUser">OTP 驗證碼</label>
      <input type="text" id="otpCodeUser" maxlength="6" placeholder="輸入6位數驗證碼" />
      <p id="otpErrorUser" class="error" style="display:none;"></p>
      <div style="margin-top:1rem; text-align:right;">
        <button id="otpSubmitBtnUser">提交驗證</button>
      </div>
    `;
    modal.box.querySelector('#otpSubmitBtnUser').onclick = () => {
        const otpCode = modal.box.querySelector('#otpCodeUser').value.trim();
        const otpError = modal.box.querySelector('#otpErrorUser');
        if (!otpCode || !/^\d+$/.test(otpCode)) {
            otpError.textContent = '請輸入有效的 OTP 驗證碼。';
            otpError.style.display = 'block';
            return;
        }
        otpError.style.display = 'none';
        modal.box.innerHTML = `
            <h3>驗證中...</h3>
            <p>正在驗證您的付款資訊，請稍候...</p>
        `;
        setTimeout(() => {
            // Pass the full paymentDetails (which includes event, session, selectedSection, quantity)
            completePurchase(paymentDetails, '信用卡', modal, onPurchaseSuccessCallbackRef);
        }, 3000);
    };
}

export function processLinePayPayment(modal, paymentDetails, onPurchaseSuccessCallbackRef) {
    modal.box.innerHTML = `
      <h3>LINE Pay 支付</h3>
      <p>正在將您重新導向到 LINE Pay...</p>
      <div class="info" style="margin-top:1rem;">請勿關閉視窗，付款完成後將自動返回。</div>
      <div style="margin-top: 1rem, text-align: center;">
        <img src="https://scdn.line-apps.com/n/line_pay/img/lp_logo.png" alt="LINE Pay Logo" style="height: 50px;">
      </div>
    `;
    setTimeout(() => {
        modal.box.innerHTML = `
            <h3>LINE Pay 支付</h3>
            <p>正在確認 LINE Pay 付款結果...</p>
        `;
        setTimeout(() => {
            // Pass the full paymentDetails
            completePurchase(paymentDetails, 'LINE Pay', modal, onPurchaseSuccessCallbackRef);
        }, 3000);
    }, 5000);
}

export function processAtmPayment(modal, paymentDetails, onPurchaseSuccessCallbackRef) {
    modal.box.innerHTML = `
      <h3>ATM 轉帳繳費</h3>
      <div style="background:#f0f0f0; padding:1rem; border-radius:8px; margin-bottom:1rem;">
        <strong>銀行代碼：</strong> 822<br>
        <strong>轉帳帳號：</strong> 1234-5678-9000-8888
      </div>
      <div class="info" style="margin-bottom:1rem;">請於期限內完成轉帳，否則訂單將自動取消。</div>
      <div style="text-align:right;">
        <button id="atmPayBtnUser" style="background:var(--primary-color);">立即繳費 (模擬)</button>
      </div>
    `;
    modal.box.querySelector('#atmPayBtnUser').onclick = function () {
        modal.box.innerHTML = `
            <h3>ATM 轉帳繳費</h3>
            <p>正在確認您的轉帳紀錄...</p>
            <div class="info" style="margin-top:1rem;">請勿關閉視窗，完成後將自動返回。</div>
        `;
        setTimeout(() => {
            // Pass the full paymentDetails
            completePurchase(paymentDetails, 'ATM 轉帳', modal, onPurchaseSuccessCallbackRef);
        }, 5000);
    };
}

// Modified completePurchase to accept paymentDetails object
function completePurchase(paymentDetails, paymentMethodDesc, modal, onPurchaseSuccessCallbackRef) {
    const { tickets } = appDataRef; // tickets from appDataRef.tickets
    const currentUser = getCurrentUserCallbackRef();
    const { event, session, selectedSection, quantity } = paymentDetails; // quantity is the number of tickets to buy

    // Find the specific section in the concert's session to update ticketsSold
    const concertToUpdate = appDataRef.concerts.find(c => c.id === event.id);
    if (!concertToUpdate) {
        console.error("Concert not found for updating ticket sales.");
        alert("發生錯誤，無法完成購買。請稍後再試。");
        removeModal(modal.overlay);
        return;
    }
    const sessionToUpdate = concertToUpdate.sessions.find(s => s.id === session.id);
    if (!sessionToUpdate) {
        console.error("Session not found for updating ticket sales.");
        alert("發生錯誤，無法完成購買。請稍後再試。");
        removeModal(modal.overlay);
        return;
    }
    const sectionToUpdate = sessionToUpdate.sections.find(sec => sec.sectionId === selectedSection.sectionId);
    if (!sectionToUpdate) {
        console.error("Section not found for updating ticket sales.");
        alert("發生錯誤，無法完成購買。請稍後再試。");
        removeModal(modal.overlay);
        return;
    }

    sectionToUpdate.ticketsSold += quantity;

    // Create individual ticket records for the user
    for (let i = 0; i < quantity; i++) {
        tickets.push({
            id: `T${Date.now()}-${currentUser.username.slice(0,3)}-${i}`, // Unique ticket ID
            username: currentUser.username,
            concertId: event.id,
            sessionId: session.id,
            sectionId: selectedSection.sectionId,
            quantity: 1, // Each ticket record represents 1 ticket
            status: 'normal', // 'normal', 'refund_pending', 'refunded'
            purchaseTime: Date.now(),
            paymentMethod: paymentMethodDesc,
            // seatNumber: null, // Placeholder for future seat selection feature
        });
    }

    saveDataCallbackRef();

    if (onPurchaseSuccessCallbackRef) {
        onPurchaseSuccessCallbackRef();
    }
    
    alert(`成功使用 ${paymentMethodDesc} 購買 ${event.title} - ${new Date(session.dateTime).toLocaleDateString()} (${selectedSection.name || selectedSection.sectionId}) ${quantity} 張票券！`);
    removeModal(modal.overlay);
}
