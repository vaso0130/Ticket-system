// Admin module (admin.js)
import { initVenueManagementModule, renderVenueManagementUI } from './venueManagement.js';
import { initEventManagementModule, renderAdminEventManagementUI } from './eventManagement.js'; // Import event management
import { renderAdminRefundReviewUI } from './refund.js'; // Import refund review UI

let mainContentElement;
let appData = {}; // { users, venues, concerts, tickets }
let uiHelpers = {}; // { roleNameDisplay, populateVenueOptions }
let saveDataCallback;
let getCurrentUserCallback;

export function initAdminModule(contentEl, data, ui, saveDataFn, getCurrentUserFn) {
  mainContentElement = contentEl;
  appData = data;
  uiHelpers = ui; // uiHelpers is now the full object from app.js
  saveDataCallback = saveDataFn;
  getCurrentUserCallback = getCurrentUserFn;

  // Pass the full uiHelpers to venueManagementModule
  initVenueManagementModule(
    mainContentElement.querySelector('#adminContent') || mainContentElement, 
    appData, // Pass the full appData object which includes concerts for delete check
    uiHelpers, // Pass the full uiHelpers object
    saveDataCallback
  );
  // Initialize event management for admin
  // Pass only necessary data, not the mainContentElement directly to init
  initEventManagementModule(
    { venues: appData.venues, concerts: appData.concerts },
    uiHelpers, 
    saveDataCallback,
    getCurrentUserCallback // Admin needs this to set organizerId
  );
}

// ------------------ Admin dashboard ----------------------
// Admin: manage venues, ticketing, accounting, users

export function renderAdminDashboardUI(){
  if (!mainContentElement || !appData.users || !getCurrentUserCallback) {
    console.error("Admin module not initialized properly.");
    mainContentElement.innerHTML = "<p>管理模組載入錯誤，請稍後再試。</p>";
    return;
  }
  mainContentElement.innerHTML = `
  <h2>管理者控制台</h2>
  <nav style="margin-bottom: 1rem;">
    <button id="adminUsersBtn">使用者帳號管理</button>
    <button id="adminVenuesBtn">場地管理</button>
    <button id="adminTicketsBtn">票務管理</button>
    <button id="adminRefundBtn">退票審核</button>
    <button id="adminSalesReportBtn">銷售報表匯出</button> 
  </nav>
  <section id="adminContent">
  </section>
  `;
  document.getElementById('adminUsersBtn').onclick = () => renderAdminUsers();
  document.getElementById('adminVenuesBtn').onclick = () => renderVenueManagementUI();
  // Pass mainContentElement to renderAdminEventManagementUI
  document.getElementById('adminTicketsBtn').onclick = () => renderAdminEventManagementUI(mainContentElement, 'adminContent'); 
  document.getElementById('adminRefundBtn').onclick = () => renderAdminRefundReviewUI('adminContent'); // Use imported function
  document.getElementById('adminSalesReportBtn').onclick = () => renderAdminSalesReportUI('adminContent'); // New button

  // Default show users
  renderAdminUsers();
}

// Admin manage users
function renderAdminUsers(){
  const container = mainContentElement.querySelector('#adminContent');
  if (!container) return;
  container.innerHTML = `
    <h3>使用者帳號管理</h3>
    <p>點擊使用者列的「檢視」按鈕以查看詳細資訊或進行操作。</p>
    <div class="table-responsive">
      <table class="user-table">
        <thead>
          <tr>
            <th>使用者名稱</th>
            <th>身分組</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody id="userListAdminBody"></tbody>
      </table>
    </div>
    <form id="addUserForm" style="margin-top:2rem; max-width:400px; padding: 1rem; background-color: #f9f9f9; border-radius: 8px;">
      <h4>新增使用者</h4>
      <label for="newUsername">使用者名稱</label>
      <input type="text" id="newUsername" required />
      <label for="newName">姓名</label>
      <input type="text" id="newName" required />
      <label for="newEmail">Email</label>
      <input type="email" id="newEmail" required />
      <label for="newPassword">密碼</label>
      <input type="password" id="newPassword" required />
      <label for="newRoles">身分組</label>
      <select id="newRoles" multiple required style="height: 100px;">
        <option value="admin">管理者</option>
        <option value="organizer">主辦方</option>
        <option value="spectator">觀眾</option>
      </select>
      <p style="font-size:0.85rem; color:#666; margin-top:0.25rem;">(可多選，按 Ctrl/Cmd 多選身分組)</p>
      <button type="submit" style="margin-top:1rem;">新增使用者</button>
      <p id="addUserMsg" class="success" style="display:none;"></p>
      <p id="addUserError" class="error" style="display:none;"></p>
    </form>
  `;
  renderUserListAdmin();
  document.getElementById('addUserForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('newUsername').value.trim();
    const password = document.getElementById('newPassword').value;
    const name = document.getElementById('newName').value.trim();
    const email = document.getElementById('newEmail').value.trim();
    const select = document.getElementById('newRoles');
    const roles = Array.from(select.selectedOptions).map(o => o.value);
    const msg = document.getElementById('addUserMsg');
    const err = document.getElementById('addUserError');
    msg.style.display = 'none';
    err.style.display = 'none';

    if(appData.users.find(u => u.username === username)) {
      err.textContent = '使用者名稱已被使用';
      err.style.display = 'block';
      return;
    }
    if(!username || !password || !name || !email || roles.length===0) {
      err.textContent = '所有欄位皆為必填且需選擇身分組';
      err.style.display = 'block';
      return;
    }
    appData.users.push({username, password, name, email, roles});
    // Note: In a real app, passwords should be hashed. User data persistence is handled by app.js or data.js load/save.
    msg.textContent = '新增成功！';
    msg.style.display = 'block';
    e.target.reset();
    renderUserListAdmin();
  });
}
function renderUserListAdmin(){
  const tbody = mainContentElement.querySelector('#userListAdminBody');
  if (!tbody) return;
  tbody.innerHTML = '';
  // const currentUser = getCurrentUserCallback(); // No longer needed here directly for button logic
  appData.users.forEach(u => {
    const tr = document.createElement('tr');
    // tr.classList.add('user-row'); // Keep if specific row styling is needed
    const roleLabels = u.roles.map(r => uiHelpers.roleNameDisplay(r)).join(', ');
    
    tr.innerHTML = `
      <td>${u.username}</td>
      <td>${roleLabels}</td>
      <td class="actions-cell"></td>
    `;

    const actionsCell = tr.querySelector('.actions-cell');

    const viewButton = document.createElement('button');
    viewButton.textContent = '檢視';
    viewButton.className = 'small-btn view-btn';
    viewButton.onclick = (e) => {
      e.stopPropagation(); 
      showViewUserModal(u);
    };
    actionsCell.appendChild(viewButton);
    tbody.appendChild(tr);
  });
}

function showViewUserModal(user) {
  if (!uiHelpers.createModal || !uiHelpers.removeModal) {
    console.error("Modal helpers not available in Admin module");
    alert(`使用者名稱: ${user.username}\n姓名: ${user.name || 'N/A'}\nEmail: ${user.email || 'N/A'}\n身分組: ${user.roles.map(r => uiHelpers.roleNameDisplay(r)).join(', ')}`);
    return;
  }
  const viewModal = uiHelpers.createModal();
  viewModal.box.style.animation = 'fadeInScaleUp 0.3s ease-out forwards';
  const roleLabels = user.roles.map(r => uiHelpers.roleNameDisplay(r)).join(', ');
  
  let actionButtonsHTML = '';
  const loggedInUser = getCurrentUserCallback();
  if (loggedInUser && user.username !== loggedInUser.username) {
    actionButtonsHTML = `
      <button id="editUserFromViewBtn" class="small-btn edit-btn" style="margin-right: 10px;">編輯</button>
      <button id="deleteUserFromViewBtn" class="small-btn delete-btn">刪除</button>
    `;
  }

  viewModal.box.innerHTML = `
    <h3>使用者詳細資訊 - ${user.username}</h3>
    <p><strong>姓名:</strong> ${user.name || 'N/A'}</p>
    <p><strong>Email:</strong> ${user.email || 'N/A'}</p>
    <p><strong>身分組:</strong> ${roleLabels}</p>
    <hr style="margin: 1rem 0;">
    <div style="text-align:right; margin-top:1rem;">
      ${actionButtonsHTML}
      <button id="closeViewModalBtn" style="margin-left: ${actionButtonsHTML ? '10px' : '0'}; background: #888;">關閉</button>
    </div>
  `;

  if (loggedInUser && user.username !== loggedInUser.username) {
    viewModal.box.querySelector('#editUserFromViewBtn').onclick = () => {
      uiHelpers.removeModal(viewModal.overlay); // Close view modal first
      showEditUserModal(user);
    };
    viewModal.box.querySelector('#deleteUserFromViewBtn').onclick = () => {
      if (confirm(`您確定要刪除使用者 ${user.username} 嗎？此操作無法復原。`)) {
        promptAdminPasswordForConfirmation(
          `刪除使用者 ${user.username}`,
          () => {
            const idx = appData.users.findIndex(us => us.username === user.username);
            if(idx !== -1){
              appData.users.splice(idx,1);
              renderUserListAdmin();
              uiHelpers.removeModal(viewModal.overlay); // Close view modal after successful deletion
              alert(`使用者 ${user.username} 已成功刪除。`);
            }
          }
        );
      }
    };
  }

  viewModal.box.querySelector('#closeViewModalBtn').onclick = () => {
    viewModal.overlay.style.animation = 'fadeOut 0.3s ease-out forwards';
    viewModal.box.style.animation = 'fadeOutScaleDown 0.3s ease-out forwards';
    setTimeout(() => uiHelpers.removeModal(viewModal.overlay), 300);
  };
}

function showEditUserModal(user) { // Removed onSaveCallback for now, will integrate password prompt directly
  if (!uiHelpers.createModal || !uiHelpers.removeModal) {
    console.error("Modal helpers not available in Admin module");
    return;
  }
  const editModal = uiHelpers.createModal();
  editModal.box.style.animation = 'fadeInScaleUp 0.3s ease-out forwards';
  const roleOptions = ['admin', 'organizer', 'spectator'];
  let rolesCheckboxes = roleOptions.map(role => `
    <label style="display:block; margin-bottom:0.5rem;">
      <input type="checkbox" name="roles" value="${role}" ${user.roles.includes(role) ? 'checked' : ''}>
      ${uiHelpers.roleNameDisplay(role)}
    </label>
  `).join('');

  editModal.box.innerHTML = `
    <h3>編輯使用者 - ${user.username}</h3>
    <form id="editUserFormAdmin">
      <label for="editNameAdmin">姓名</label>
      <input type="text" id="editNameAdmin" value="${user.name || ''}" required />
      <label for="editEmailAdmin">Email</label>
      <input type="email" id="editEmailAdmin" value="${user.email || ''}" required />
      <label>身分組</label>
      <div id="editRolesAdmin" style="margin-bottom:1rem; padding:0.5rem; border:1px solid #ccc; border-radius:4px;">
        ${rolesCheckboxes}
      </div>
      <p id="editUserErrorAdmin" class="error" style="display:none;"></p>
      <div style="text-align:right; margin-top:1rem;">
        <button type="button" id="cancelEditUserBtnAdmin" style="margin-right:0.5rem; background:#888;">取消</button>
        <button type="submit">儲存變更</button>
      </div>
    </form>
  `;

  editModal.box.querySelector('#cancelEditUserBtnAdmin').onclick = () => {
    editModal.overlay.style.animation = 'fadeOut 0.3s ease-out forwards';
    editModal.box.style.animation = 'fadeOutScaleDown 0.3s ease-out forwards';
    setTimeout(() => uiHelpers.removeModal(editModal.overlay), 300);
  };

  editModal.box.querySelector('#editUserFormAdmin').addEventListener('submit', (e) => {
    e.preventDefault();
    const newName = document.getElementById('editNameAdmin').value.trim();
    const newEmail = document.getElementById('editEmailAdmin').value.trim();
    const selectedRoles = Array.from(document.querySelectorAll('#editRolesAdmin input[name="roles"]:checked')).map(cb => cb.value);
    const errorP = document.getElementById('editUserErrorAdmin');
    errorP.style.display = 'none';

    if (!newName || !newEmail) {
      errorP.textContent = '姓名和 Email 不可為空。';
      errorP.style.display = 'block';
      return;
    }
    if (selectedRoles.length === 0) {
      errorP.textContent = '至少需要選擇一個身分組。';
      errorP.style.display = 'block';
      return;
    }

    // Prompt for admin password before saving changes
    promptAdminPasswordForConfirmation(
      `儲存對 ${user.username} 的變更`,
      () => {
        const userToUpdate = appData.users.find(u => u.username === user.username);
        if (userToUpdate) {
          userToUpdate.name = newName;
          userToUpdate.email = newEmail;
          userToUpdate.roles = selectedRoles;
          renderUserListAdmin(); 
          editModal.overlay.style.animation = 'fadeOut 0.3s ease-out forwards';
          editModal.box.style.animation = 'fadeOutScaleDown 0.3s ease-out forwards';
          setTimeout(() => uiHelpers.removeModal(editModal.overlay), 300);
          alert(`使用者 ${user.username} 的資料已更新。`);
        } else {
          // This should ideally not happen if user object is consistent
          errorP.textContent = '找不到使用者資料，無法更新。';
          errorP.style.display = 'block';
        }
      }
    );
  });
}

function promptAdminPasswordForConfirmation(actionDescription, callbackOnSuccess) {
  if (!uiHelpers.createModal || !uiHelpers.removeModal) {
    console.error("Modal helpers not available for password prompt.");
    // Fallback if modals are not available, though unlikely if other modals work
    const password = prompt(`請輸入您的管理員密碼以 ${actionDescription}:`);
    if (password === null) return; // User canceled
    // Simulate password check (always succeeds here)
    setTimeout(() => {
      callbackOnSuccess();
      alert('操作成功。'); // Inform about success
    }, 300);
    return;
  }
  const passwordModal = uiHelpers.createModal();
  passwordModal.box.style.animation = 'fadeInScaleUp 0.3s ease-out forwards';

  passwordModal.box.innerHTML = `
    <h3>管理員密碼確認</h3>
    <p>請輸入您的管理員密碼以確認此操作:</p>
    <input type="password" id="adminPasswordInput" style="width:100%; padding:0.5rem; margin:1rem 0; border:1px solid #ccc; border-radius:4px;" required />
    <p id="adminPasswordError" class="error" style="display:none;"></p>
    <div style="text-align:right;">
      <button id="cancelPasswordPromptBtn" style="margin-right:0.5rem; background:#888;">取消</button>
      <button id="confirmPasswordPromptBtn">確認</button>
    </div>
  `;

  passwordModal.box.querySelector('#cancelPasswordPromptBtn').onclick = () => {
    passwordModal.overlay.style.animation = 'fadeOut 0.3s ease-out forwards';
    passwordModal.box.style.animation = 'fadeOutScaleDown 0.3s ease-out forwards';
    setTimeout(() => uiHelpers.removeModal(passwordModal.overlay), 300);
  };

  passwordModal.box.querySelector('#confirmPasswordPromptBtn').onclick = () => {
    const password = document.getElementById('adminPasswordInput').value;
    const errorP = document.getElementById('adminPasswordError');
    errorP.style.display = 'none';

    // Simulate password check (replace with real check)
    if (password === 'admin') {
      callbackOnSuccess();
      passwordModal.overlay.style.animation = 'fadeOut 0.3s ease-out forwards';
      passwordModal.box.style.animation = 'fadeOutScaleDown 0.3s ease-out forwards';
      setTimeout(() => uiHelpers.removeModal(passwordModal.overlay), 300);
      alert('操作成功。');
    } else {
      errorP.textContent = '密碼錯誤，請再試一次。';
      errorP.style.display = 'block';
    }
  };
}

// ------------------ Admin Sales Report ----------------------
function renderAdminSalesReportUI(targetContainerId = 'adminContent') {
  const container = mainContentElement.querySelector(`#${targetContainerId}`);
  if (!container) {
    console.error("Target container for sales report not found:", targetContainerId);
    return;
  }
  container.innerHTML = `
    <h3>活動銷售報表</h3>
    <p>此功能將匯出所有活動場次的銷售數據。</p>
    <button id="downloadSalesReportCsvBtn" style="margin-top:1rem;">下載銷售報表 (CSV)</button>
    <div id="salesReportStatus" style="margin-top:1rem;"></div>
  `;

  document.getElementById('downloadSalesReportCsvBtn').onclick = () => {
    const statusDiv = document.getElementById('salesReportStatus');
    try {
      const csvData = generateSalesReportCSV();
      downloadCSV(csvData, 'sales_report.csv');
      statusDiv.textContent = '報表已成功下載！';
      statusDiv.className = 'success';
    } catch (error) {
      console.error("Error generating sales report:", error);
      statusDiv.textContent = '產生報表時發生錯誤。';
      statusDiv.className = 'error';
    }
  };
}

function generateSalesReportCSV() {
  const { concerts, venues } = appData;
  if (!concerts || !venues) {
    throw new Error("Concert or venue data is not available.");
  }

  let csvRows = [];
  // Add header row
  csvRows.push(["主活動ID", "主活動標題", "場次ID", "場次時間", "場地名稱", "區域ID", "區域名稱", "票價", "已售票數", "該區域總收入"]);

  concerts.forEach(event => {
    const venue = venues.find(v => v.id === event.venueId);
    const venueName = venue ? venue.name : '未知場地';

    if (event.sessions && event.sessions.length > 0) {
      event.sessions.forEach(session => {
        const sessionDateTime = new Date(session.dateTime).toLocaleString();
        if (session.sections && session.sections.length > 0) {
          session.sections.forEach(sectionDetail => {
            const venueSection = venue && venue.seatMap ? venue.seatMap.find(vs => vs.id === sectionDetail.sectionId) : null;
            const sectionName = venueSection ? venueSection.name : sectionDetail.sectionId;
            const price = sectionDetail.price;
            const ticketsSold = sectionDetail.ticketsSold;
            const sectionRevenue = price * ticketsSold;

            csvRows.push([
              event.id,
              event.title,
              session.sessionId,
              sessionDateTime,
              venueName,
              sectionDetail.sectionId,
              sectionName,
              price,
              ticketsSold,
              sectionRevenue
            ]);
          });
        }
      });
    }
  });
  // Convert array of arrays to CSV string
  let csvContent = "data:text/csv;charset=utf-8,";
  csvRows.forEach(rowArray => {
    let row = rowArray.map(item => `"${String(item).replace(/"/g, '""')}"`).join(","); // Escape double quotes and quote all fields
    csvContent += row + "\r\n";
  });
  return csvContent;
}

function downloadCSV(csvContent, fileName) {
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", fileName);
  document.body.appendChild(link); 
  link.click();
  document.body.removeChild(link);
}

//# sourceMappingURL=admin.js.map
