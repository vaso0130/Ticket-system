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
    <section id="staffContent"></section>
    `;
    const staffContent = mainContentRef.querySelector('#staffContent');
    renderVerificationUI(staffContent);
}

