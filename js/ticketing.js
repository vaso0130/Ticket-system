// Ticketing Module
import { createModal, removeModal } from './ui.js';
import { processCreditCardPayment, processLinePayPayment, processAtmPayment } from './payment.js'; // Import payment processing functions

let appDataRef;
let saveDataCallbackRef;
let getCurrentUserCallbackRef;
let onPurchaseSuccessCallbackRef;

export function initTicketingModule(data, saveDataFunc, getCurrentUserFunc, onPurchaseSuccessFunc) {
    appDataRef = data;
    saveDataCallbackRef = saveDataFunc;
    getCurrentUserCallbackRef = getCurrentUserFunc;
    onPurchaseSuccessCallbackRef = onPurchaseSuccessFunc;
}

// Modal buy tickets
export function handleShowBuyTicketModal(event, session) { // Modified to accept event and session
    const { tickets } = appDataRef;
    const currentUser = getCurrentUserCallbackRef();
    const modal = createModal(); // Assuming createModal is globally available or imported correctly

    if (!event || !session || !session.sections || session.sections.length === 0) {
        createModal('錯誤', '<p>無法載入票券資訊，活動或場次資料不完整。</p>', [{ text: '關閉', onClick: () => removeModal() }]);
        return;
    }

    let sectionOptionsHtml = '';
    session.sections.forEach(section => {
        const venue = appDataRef.venues.find(v => v.id === event.venueId);
        const venueSection = venue ? venue.seatMap.find(vs => vs.id === section.sectionId) : null;
        const sectionName = venueSection ? venueSection.name : section.sectionId;
        const ticketsLeftInSection = section.ticketsAvailable - section.ticketsSold;
        if (ticketsLeftInSection > 0) { // Only show sections with available tickets
            sectionOptionsHtml += `<option value="${section.sectionId}">${sectionName} (NT$${section.price} - 剩餘 ${ticketsLeftInSection} 張)</option>`;
        }
    });

    if (!sectionOptionsHtml) {
        modal.box.innerHTML = `
            <h3>${event.title} - ${new Date(session.dateTime).toLocaleString()}</h3>
            <p>此場次所有區域的票券均已售完。</p>
            <div style="margin-top:1rem; text-align:right;">
                <button id="cancelBtnUser" style="margin-right:0.5rem; background:#888;">關閉</button>
            </div>
        `;
        modal.box.querySelector('#cancelBtnUser').onclick = () => removeModal(modal.overlay);
        return;
    }

    modal.box.innerHTML = `
      <h3>購買票券 - ${event.title}</h3>
      <h4>場次: ${new Date(session.dateTime).toLocaleString()}</h4>
      <label for="ticketSectionUser">選擇區域</label>
      <select id="ticketSectionUser" style="width:100%; padding:0.5rem; font-size:1rem; margin-bottom:1rem;">
        ${sectionOptionsHtml}
      </select>
      <div id="sectionDetailsUser"></div>
      <label for="ticketQuantityUser">購買數量</label>
      <input type="number" id="ticketQuantityUser" min="1" value="1" style="width:100%; padding:0.5rem; font-size:1rem;" />
      <label for="payMethodUser" style="margin-top:1rem;">選擇支付方式</label>
      <select id="payMethodUser" style="width:100%; margin-top:0.25rem;">
        <option value="credit">信用卡</option>
        <option value="linepay">Line Pay</option>
        <option value="atm">ATM轉帳</option>
      </select>
      <div id="payFieldsUser" style="margin-top:1rem;"></div>
      <p id="buyErrorUser" class="error" style="display:none;"></p>
      <div style="margin-top:1rem; text-align:right;">
        <button id="cancelBtnUser" style="margin-right:0.5rem; background:#888;">取消</button>
        <button id="confirmBtnUser">確定購買</button>
      </div>
    `;

    const sectionSelect = modal.box.querySelector('#ticketSectionUser');
    const quantityInput = modal.box.querySelector('#ticketQuantityUser');
    const sectionDetailsDiv = modal.box.querySelector('#sectionDetailsUser');

    function updateTotalTicketsAvailable() {
        const selectedSectionId = sectionSelect.value;
        const selectedSection = session.sections.find(sec => sec.sectionId === selectedSectionId);
        if (selectedSection) {
            const ticketsLeft = selectedSection.ticketsAvailable - selectedSection.ticketsSold;
            quantityInput.max = ticketsLeft;
            quantityInput.value = Math.min(1, ticketsLeft); // Default to 1 or max available if less than 1
            sectionDetailsDiv.innerHTML = `<p>已選區域票價：NT$${selectedSection.price} | 剩餘票數：${ticketsLeft}</p>`;
            if (ticketsLeft === 0) {
                 modal.box.querySelector('#confirmBtnUser').disabled = true;
                 modal.box.querySelector('#buyErrorUser').textContent = '此區域已售完';
                 modal.box.querySelector('#buyErrorUser').style.display = 'block';
            } else {
                 modal.box.querySelector('#confirmBtnUser').disabled = false;
                 modal.box.querySelector('#buyErrorUser').style.display = 'none';
            }
        } else {
            sectionDetailsDiv.innerHTML = '';
            quantityInput.max = 0;
            quantityInput.value = 0;
        }
    }

    sectionSelect.addEventListener('change', updateTotalTicketsAvailable);
    updateTotalTicketsAvailable(); // Initial call

    function renderPayFields() {
        const method = modal.box.querySelector('#payMethodUser').value;
        const payFields = modal.box.querySelector('#payFieldsUser');
        if (method === 'credit') {
            payFields.innerHTML = `
          <label for="cardNumUser">信用卡號</label>
          <input type="text" id="cardNumUser" maxlength="19" placeholder="XXXX-XXXX-XXXX-XXXX" />
          <label for="cardExpUser">有效期限 (MM/YY)</label>
          <input type="text" id="cardExpUser" maxlength="5" placeholder="MM/YY" />
          <label for="cardCVCUser">安全碼</label>
          <input type="text" id="cardCVCUser" maxlength="3" placeholder="CVC" />
        `;
            // Add input formatting for card number and expiry date
            const cardNumInput = payFields.querySelector('#cardNumUser');
            const cardExpInput = payFields.querySelector('#cardExpUser');

            cardNumInput.addEventListener('input', formatCardNumber);
            cardExpInput.addEventListener('input', formatExpiryDate);

        } else if (method === 'linepay') {
            payFields.innerHTML = `
          <p>您將被引導至 LINE Pay 進行安全付款。</p>
        `;
        } else if (method === 'atm') {
            payFields.innerHTML = `
          <div id="atmInfoUser" style="background:#f0f0f0; padding:1rem; border-radius:8px; margin-bottom:1rem;">
            <strong>銀行代碼：</strong> 822<br>
            <strong>轉帳帳號：</strong> 1234-5678-9000-8888
          </div>
        `;
        }
    }
    renderPayFields();
    modal.box.querySelector('#payMethodUser').onchange = renderPayFields;

    // Helper function to format card number input with hyphens
    function formatCardNumber(e) {
        let value = e.target.value.replace(/\D/g, ''); // Remove non-digits
        let formattedValue = '';
        for (let i = 0; i < value.length; i++) {
            if (i > 0 && i % 4 === 0) {
                formattedValue += '-';
            }
            formattedValue += value[i];
        }
        e.target.value = formattedValue.substring(0, 19); // Max length 16 digits + 3 hyphens
    }

    // Helper function to format expiry date input with a slash
    function formatExpiryDate(e) {
        let value = e.target.value.replace(/\D/g, ''); // Remove non-digits
        if (value.length > 2) {
            value = value.substring(0, 2) + '/' + value.substring(2, 4);
        }
        e.target.value = value.substring(0, 5);
    }

    modal.box.querySelector('#cancelBtnUser').onclick = () => {
        removeModal(modal.overlay);
    };

    modal.box.querySelector('#confirmBtnUser').onclick = () => {
        const selectedSectionId = sectionSelect.value;
        const selectedSection = session.sections.find(sec => sec.sectionId === selectedSectionId);
        const quantity = parseInt(quantityInput.value);
        const buyError = modal.box.querySelector('#buyErrorUser');
        const method = modal.box.querySelector('#payMethodUser').value;
        buyError.style.display = 'none';

        if (!selectedSection) {
            buyError.textContent = '請選擇一個有效的票券區域';
            buyError.style.display = 'block';
            return;
        }

        const ticketsLeftInSection = selectedSection.ticketsAvailable - selectedSection.ticketsSold;

        if (isNaN(quantity) || quantity < 1) {
            buyError.textContent = '請輸入有效購買數量';
            buyError.style.display = 'block';
            return;
        }
        if (quantity > ticketsLeftInSection) {
            buyError.textContent = `此區域最多可購買 ${ticketsLeftInSection} 張票`;
            buyError.style.display = 'block';
            return;
        }

        const confirmBtn = modal.box.querySelector('#confirmBtnUser');
        confirmBtn.disabled = true;
        confirmBtn.textContent = '處理中...';

        // Pass event, session, and selectedSection to payment functions
        const paymentDetails = {
            event,
            session,
            selectedSection, // Pass the actual section object
            quantity
        };

        if (method === 'credit') {
            processCreditCardPayment(modal, paymentDetails, onPurchaseSuccessCallbackRef);
        } else if (method === 'linepay') {
            processLinePayPayment(modal, paymentDetails, onPurchaseSuccessCallbackRef);
        } else if (method === 'atm') {
            processAtmPayment(modal, paymentDetails, onPurchaseSuccessCallbackRef);
        }
    };
}
