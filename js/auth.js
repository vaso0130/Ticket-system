// Authentication related functions (login, register, etc.)
import { users } from './data.js'; // Assuming users array is in data.js

let mainContentElement, logoutButtonElement, switchRoleButtonElement, accountSettingsButtonElement; // Added accountSettingsButtonElement
let setCurrentUserCallback, setCurrentRoleCallback, saveLoginStateCallback;
let loadDataCallback, renderDashboardCallback, getCurrentUserCallback; // Added getCurrentUserCallback

export function initAuth(
    mainContent, // DOM element for auth UI
    logoutBtn,   // DOM element for logout button (to hide/show)
    switchRoleBtn, // DOM element for switch role button
    accountSettingsBtn,  // DOM element for account settings button
    setCurrentUserFn, // Callback to set current user in app.js
    setCurrentRoleFn, // Callback to set current role in app.js
    saveLoginStateFn, // Callback to save login state in app.js
    loadDataFn,       // Callback to load app data (e.g., after login)
    renderDashboardFn, // Callback to render main dashboard in app.js (after login or role selection)
    getCurrentUserFn // Callback to get current user from app.js
) {
    mainContentElement = mainContent;
    logoutButtonElement = logoutBtn; // Crucial assignment
    switchRoleButtonElement = switchRoleBtn; // Assign switch role button
    accountSettingsButtonElement = accountSettingsBtn; // Assign account settings button
    setCurrentUserCallback = setCurrentUserFn;    // Now correctly assigned
    setCurrentRoleCallback = setCurrentRoleFn;
    saveLoginStateCallback = saveLoginStateFn;
    loadDataCallback = loadDataFn;
    renderDashboardCallback = renderDashboardFn;
    getCurrentUserCallback = getCurrentUserFn; // Assign getCurrentUserFn
}

// Render login form (username + password)
export function renderLogin() {
    mainContentElement.innerHTML = `
    <div class="auth-container">
      <h2>登入</h2>
      <form id="loginForm">
        <label for="username">使用者名稱</label>
        <input type="text" id="username" required />
        <label for="password">密碼</label>
        <input type="password" id="password" required />
        <button type="submit">登入</button>
        <p id="loginError" class="error" style="display:none;"></p>
      </form>
      <p style="margin-top:1rem; text-align:center;">
        <a href="#" id="forgotPasswordLink">忘記密碼?</a> | <a href="#" id="registerLink">註冊新帳號</a>
      </p>
    </div>
    `;
    // Hide all header buttons when on the login screen
    if (logoutButtonElement) logoutButtonElement.style.display = 'none';
    if (switchRoleButtonElement) switchRoleButtonElement.style.display = 'none';
    if (accountSettingsButtonElement) accountSettingsButtonElement.style.display = 'none';


    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        const errorP = document.getElementById('loginError');

        const user = users.find(u => u.username === username && u.password === password);
        if (user) {
            setCurrentUserCallback(user); // This should now be a function
            if (user.roles.length === 1) {
                setCurrentRoleCallback(user.roles[0]);
                saveLoginStateCallback();
                // Visibility of these buttons is primarily handled by app.js's renderDashboard and updateLoginRelatedUI
                // Calling renderDashboard will update them.
                await loadDataCallback();
                renderDashboardCallback();
            } else {
                renderRoleSelection(user);
            }
        } else {
            errorP.textContent = '錯誤的使用者名稱或密碼';
            errorP.style.display = 'block';
        }
    });
    document.getElementById('forgotPasswordLink').onclick = (e) => { e.preventDefault(); renderForgotPassword(); };
    document.getElementById('registerLink').onclick = (e) => { e.preventDefault(); renderRegister(); };
}

// 忘記密碼流程
export function renderForgotPassword() {
    mainContentElement.innerHTML = `
    <div class="auth-container">
      <h2>忘記密碼</h2>
      <form id="forgotPasswordFormStep1">
        <label for="usernameForgot">使用者名稱</label>
        <input type="text" id="usernameForgot" required />
        <label for="emailForgot">註冊信箱</label>
        <input type="email" id="emailForgot" required />
        <button type="submit">下一步</button>
        <p id="forgotError" class="error" style="display:none;"></p>
      </form>
      <p style="margin-top:1rem; text-align:center;"><a href="#" id="backToLoginLinkForgot">返回登入</a></p>
    </div>
    `;
    document.getElementById('forgotPasswordFormStep1').addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('usernameForgot').value.trim();
        const email = document.getElementById('emailForgot').value.trim();
        const errorP = document.getElementById('forgotError');
        errorP.style.display = 'none';

        const user = users.find(u => u.username === username && u.email === email);

        if (user) {
            // Proceed to OTP and password reset step
            renderOtpAndPasswordReset(user);
        } else {
            errorP.textContent = '使用者名稱或信箱不正確，或查無此用戶。';
            errorP.style.display = 'block';
        }
    });
    document.getElementById('backToLoginLinkForgot').onclick = (e) => { e.preventDefault(); renderLogin(); };
}

function renderOtpAndPasswordReset(user) {
    mainContentElement.innerHTML = `
    <div class="auth-container">
      <h2>重設密碼</h2>
      <p>已發送 OTP 至您的信箱 (模擬)。請輸入 OTP 並設定新密碼。</p>
      <form id="resetPasswordForm">
        <label for="otpCode">OTP 驗證碼</label>
        <input type="text" id="otpCode" required placeholder="任意輸入即可 (模擬)" />
        <label for="newPasswordReset">新密碼</label>
        <input type="password" id="newPasswordReset" required />
        <label for="confirmNewPasswordReset">確認新密碼</label>
        <input type="password" id="confirmNewPasswordReset" required />
        <button type="submit">重設密碼</button>
        <p id="resetError" class="error" style="display:none;"></p>
        <p id="resetSuccess" class="success" style="display:none;"></p>
      </form>
      <p style="margin-top:1rem; text-align:center;"><a href="#" id="backToLoginLinkReset">返回登入</a></p>
    </div>
    `;

    document.getElementById('resetPasswordForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const otp = document.getElementById('otpCode').value.trim(); // OTP is not validated in this simulation
        const newPassword = document.getElementById('newPasswordReset').value;
        const confirmNewPassword = document.getElementById('confirmNewPasswordReset').value;
        const errorP = document.getElementById('resetError');
        const successP = document.getElementById('resetSuccess');
        errorP.style.display = 'none';
        successP.style.display = 'none';

        if (!otp) { // Basic check even if not validated
            errorP.textContent = '請輸入 OTP。';
            errorP.style.display = 'block';
            return;
        }

        if (newPassword !== confirmNewPassword) {
            errorP.textContent = '新密碼與確認密碼不相符。';
            errorP.style.display = 'block';
            return;
        }

        if (newPassword.length < 6) { // Example: Basic password strength
            errorP.textContent = '新密碼長度至少需要6位。';
            errorP.style.display = 'block';
            return;
        }

        // Update password in the users array (in-memory)
        const userToUpdate = users.find(u => u.username === user.username);
        if (userToUpdate) {
            userToUpdate.password = newPassword;
            // In a real app, you would save this to the backend/DB.
            // And potentially trigger a save of the users array if it's persisted locally,
            // though current setup doesn't persist users array changes via saveData().
            successP.textContent = '密碼已成功重設！您現在可以使用新密碼登入。';
            successP.style.display = 'block';
            document.getElementById('resetPasswordForm').reset();
            setTimeout(() => renderLogin(), 3000);
        } else {
            // Should not happen if user object was passed correctly
            errorP.textContent = '發生未知錯誤，無法更新密碼。';
            errorP.style.display = 'block';
        }
    });
    document.getElementById('backToLoginLinkReset').onclick = (e) => { e.preventDefault(); renderLogin(); };
}

// 新增：註冊表單
export function renderRegister() {
    mainContentElement.innerHTML = `
    <div class="auth-container">
      <h2>註冊新帳號</h2>
      <form id="registerForm">
        <label for="newUsername">使用者名稱</label>
        <input type="text" id="newUsername" required />
        <label for="newEmail">電子郵件</label>
        <input type="email" id="newEmail" required />
        <label for="newPassword">密碼</label>
        <input type="password" id="newPassword" required />
        <label for="confirmPassword">確認密碼</label>
        <input type="password" id="confirmPassword" required />
        <button type="submit">註冊</button>
        <p id="registerError" class="error" style="display:none;"></p>
        <p id="registerSuccess" class="success" style="display:none;"></p>
      </form>
      <p style="margin-top:1rem; text-align:center;"><a href="#" id="backToLoginLinkRegister">返回登入</a></p>
    </div>
    `;

    document.getElementById('registerForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('newUsername').value.trim();
        const email = document.getElementById('newEmail').value.trim();
        const password = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const errorP = document.getElementById('registerError');
        const successP = document.getElementById('registerSuccess');
        errorP.style.display = 'none';
        successP.style.display = 'none';

        // Basic validation
        if (!username || !email || !password || !confirmPassword) {
            errorP.textContent = '所有欄位都是必填的。';
            errorP.style.display = 'block';
            return;
        }

        if (password !== confirmPassword) {
            errorP.textContent = '密碼與確認密碼不相符。';
            errorP.style.display = 'block';
            return;
        }

        if (password.length < 6) {
            errorP.textContent = '密碼長度至少需要6位。';
            errorP.style.display = 'block';
            return;
        }

        // Check if user already exists
        const existingUser = users.find(u => u.username === username || u.email === email);
        if (existingUser) {
            errorP.textContent = '此使用者名稱或電子郵件已被註冊。';
            errorP.style.display = 'block';
            return;
        }

        // Simulate user registration
        users.push({ username, email, password, roles: ['spectator'] }); // Default to spectator role
        successP.textContent = '註冊成功！您現在可以登入。';
        successP.style.display = 'block';
        document.getElementById('registerForm').reset();
        setTimeout(() => renderLogin(), 3000);
    });

    document.getElementById('backToLoginLinkRegister').onclick = (e) => { e.preventDefault(); renderLogin(); };
}

// 新增：帳戶設定介面
export function renderAccountSettings() {
    const currentUser = getCurrentUserCallback();
    if (!currentUser) {
        renderLogin(); 
        return;
    }

    mainContentElement.innerHTML = `
    <div class="auth-container">
      <h2>帳戶設定</h2>
      <form id="accountSettingsForm">
        <label for="currentUsername">使用者名稱 (不可修改)</label>
        <input type="text" id="currentUsername" value="${currentUser.username}" readonly />

        <label for="accountName">姓名</label>
        <input type="text" id="accountName" value="${currentUser.name || ''}" required />

        <label for="accountEmail">Email</label>
        <input type="email" id="accountEmail" value="${currentUser.email || ''}" required />

        <label for="accountPassword">新密碼 (留空則不修改)</label>
        <input type="password" id="accountPassword" />

        <label for="confirmAccountPassword">確認新密碼</label>
        <input type="password" id="confirmAccountPassword" />
        
        <p style="margin-top:1rem;"><strong>如需修改管理員或主辦方帳號的密碼，請聯繫超級管理員。</strong></p>

        <button type="submit">儲存變更</button>
        <p id="accountSettingsError" class="error" style="display:none;"></p>
        <p id="accountSettingsSuccess" class="success" style="display:none;"></p>
      </form>
      <p style="margin-top:1rem; text-align:center;"><a href="#" id="backToDashboardLink">返回主畫面</a></p>
    </div>
    `;

    // Hide header buttons when on account settings page
    if (logoutButtonElement) logoutButtonElement.style.display = 'none';
    if (switchRoleButtonElement) switchRoleButtonElement.style.display = 'none';
    if (accountSettingsButtonElement) accountSettingsButtonElement.style.display = 'none';

    document.getElementById('accountSettingsForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('accountName').value.trim();
        const email = document.getElementById('accountEmail').value.trim();
        const msgEl = document.getElementById('accountSettingsSuccess');
        const errEl = document.getElementById('accountSettingsError');
        msgEl.style.display = 'none';
        errEl.style.display = 'none';

        if (!name || !email) {
            errEl.textContent = '姓名和電子郵件為必填欄位。';
            errEl.style.display = 'block';
            return;
        }

        // 在模擬環境中，我們需要找到 users 陣列中的使用者並更新
        const userToUpdate = users.find(u => u.username === currentUser.username);
        if (userToUpdate) {
            // 檢查 email 是否已被其他使用者使用 (除了自己)
            const emailExists = users.some(u => u.email === email && u.username !== currentUser.username);
            if (emailExists) {
                errEl.textContent = '此電子郵件已被其他帳號使用。';
                errEl.style.display = 'block';
                return;
            }

            userToUpdate.name = name;
            userToUpdate.email = email;
            
            // 更新 localStorage 中的 currentUser
            if (saveLoginStateCallback) {
                 // setCurrentUserCallback is used to update the currentUser in app.js
                setCurrentUserCallback(userToUpdate); // Update in-memory currentUser in app.js
                saveLoginStateCallback(); // This will save the updated currentUser to localStorage
            }
            
            msgEl.textContent = '帳戶資訊已更新！';
            msgEl.style.display = 'block';
        } else {
            errEl.textContent = '更新失敗，找不到使用者資料。';
            errEl.style.display = 'block';
        }
    });

    document.getElementById('backToDashboardLink').onclick = (e) => {
        e.preventDefault();
        if (renderDashboardCallback) {
            renderDashboardCallback();
        } else {
            // Fallback if renderDashboardCallback is not available
            renderLogin();
        }
    };
}

// Role selection UI after login if multiple roles
export function renderRoleSelection(user) {
    mainContentElement.innerHTML = `
    <div class="auth-container">
      <h2>選擇您的身分</h2>
      <p>使用者 ${user.username}，請選擇您要使用的身分：</p>
      <div id="roleButtonsContainer" style="display:flex; flex-direction:column; gap:0.5rem;"></div>
    </div>
    `;
    const container = document.getElementById('roleButtonsContainer');
    user.roles.forEach(role => {
        const btn = document.createElement('button');
        btn.textContent = roleNameDisplay(role); // Use roleNameDisplay from ui.js (assuming it's globally available or passed in)
        btn.onclick = async () => {
            setCurrentRoleCallback(role);
            saveLoginStateCallback();
            logoutButtonElement.style.display = 'inline-block';
            switchRoleButtonElement.style.display = user.roles.length > 1 ? 'inline-block' : 'none'; // Show if multiple roles
            await loadDataCallback();
            renderDashboardCallback();
        };
        container.appendChild(btn);
    });
}

// Helper to display role names (could be moved to ui.js if not already there and imported)
// Ensure this is consistent with ui.js version or use the imported one.
function roleNameDisplay(role) {
    switch (role) {
        case 'admin': return '管理者';
        case 'organizer': return '主辦方';
        case 'spectator': return '觀眾';
        default: return role;
    }
}

export function handleSwitchRole() {
    if (currentUser && currentUser.roles.length > 1) {
        renderRoleSelection(currentUser);
        // Hide buttons during role selection
        logoutButtonElement.style.display = 'none';
        switchRoleButtonElement.style.display = 'none';
    } else {
        // This case should ideally not be reached if the button is only shown for multi-role users
        console.warn("Switch role called for single-role user or no user.");
    }
}

// Add this to the end of the file or integrate into existing event listener setup if any
// This assumes switchRoleButtonElement is accessible here. If not, pass it or attach event in initAuth.
// It's better to attach this event listener in initAuth or app.js where the element is queried.
