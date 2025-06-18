// Staff module for ticket verification
import { renderVerificationUI } from './verification.js';

let mainContentRef;
let appDataRef;
let saveDataCallbackRef;

export function initStaffModule(mainContentElement, data, saveDataFunc) {
    mainContentRef = mainContentElement;
    appDataRef = data;
    saveDataCallbackRef = saveDataFunc;
}

export function renderStaffDashboardUI() {
    if (!mainContentRef) return;
    mainContentRef.innerHTML = `
    <h2>工作人員專區</h2>
    <div style="margin-bottom:1rem;">
      <button id="scanQRBtn" class="small-btn">使用相機掃描 QR Code</button>
    </div>
    <section id="staffContent"></section>
    `;
    const staffContent = mainContentRef.querySelector('#staffContent');
    renderVerificationUI(staffContent);
    // 新增掃描按鈕提示（統一用 modal）
    const scanBtn = document.getElementById('scanQRBtn');
    if (scanBtn) {
      scanBtn.onclick = () => {
        import('./ui.js').then(mod => {
          mod.createModal('提示', `目前為測試，尚未支援相機功能，請手動輸入票號。`, [
            { text: '確定', onClick: () => mod.removeModal() }
          ]);
        });
      };
    }
}

