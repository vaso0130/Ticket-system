import { fetchFromDB, saveToDB, exportToJSON, importFromJSON } from './db.js';

  // Users: username, password, roles[]
  const users = [
    {username: 'admin', password: 'admin123', roles: ['admin']},
    {username: 'org1', password: 'org123', roles: ['organizer']},
    {username: 'org2', password: 'org234', roles: ['organizer']},
    {username: 'user1', password: 'user123', roles: ['spectator']},
    {username: 'user2', password: 'user234', roles: ['spectator']},
    // Multi-role user for testing
    {username: 'multiuser', password: 'multi123', roles: ['admin','organizer']}
  ];

  // Venues database: id, name, location, capacity
  let venues = [
    {id:1, name:'台北小巨蛋', location: '台北市信義區', capacity: 15000},
    {id:2, name:'高雄巨蛋', location: '高雄市左營區', capacity: 13000}
  ];

  // Concerts database with zone info
  let concerts = [
    {
      id: 1,
      title: '流行音樂演唱會',
      date: '2024-09-15',
      venueId: 1,
      ticketsAvailable: 100,
      ticketsSold: 0,
      zones: [
        {name: '搖滾區', price: 2000, capacity: 30, sold: 0},
        {name: '熱區', price: 1700, capacity: 30, sold: 0},
        {name: '一般區', price: 1500, capacity: 40, sold: 0}
      ]
    },
    {
      id: 2,
      title: '搖滾之夜',
      date: '2024-10-01',
      venueId: 2,
      ticketsAvailable: 200,
      ticketsSold: 0,
      zones: [
        {name: '搖滾區', price: 1600, capacity: 80, sold: 0},
        {name: '熱區', price: 1400, capacity: 60, sold: 0},
        {name: '一般區', price: 1200, capacity: 60, sold: 0}
      ]
    }
  ];

  // Tickets purchased: {username, concertId, quantity}
  let tickets = [];

  // Current logged in user and selected role
  let currentUser = null;
  let currentRole = null;

  const app = document.getElementById('app');
  const mainContent = document.getElementById('mainContent');
  const logoutBtn = document.getElementById('logoutBtn');
  const importDbBtn = document.getElementById('importDbBtn');
  const exportDbBtn = document.getElementById('exportDbBtn');
  const dbFileInput = document.getElementById('dbFileInput');

  function showHeaderButtons(show){
    const logoutDisplay = show ? 'inline-block' : 'none';
    logoutBtn.style.display = logoutDisplay;
    const dbDisplay = show && (currentRole==='admin' || currentRole==='organizer') ? 'inline-block' : 'none';
    importDbBtn.style.display = dbDisplay;
    exportDbBtn.style.display = dbDisplay;
  }

  function setMainHTML(html){
    mainContent.innerHTML = html;
    animateContent();
  }

  function animateContent(){
    if (window.anime) {
      anime({ targets: '#mainContent', opacity: [0,1], duration: 600, easing: 'easeOutQuad' });
    } else {
      const el = document.querySelector('#mainContent');
      if(el) el.style.opacity = 1;
    }
  }

  // Persistent storage keys
  const STORAGE_KEYS = {
    CURRENT_USER: 'currentUser',
    CURRENT_ROLE: 'currentRole'
  };

  // Utility: save/load data via the backend server
  async function saveData() {
    await saveToDB({ venues, concerts, tickets });
  }
  async function loadData() {
    const data = await fetchFromDB();
    if (data.venues) venues = data.venues;
    if (data.concerts) concerts = data.concerts;
    if (data.tickets) tickets = data.tickets;
  }

  // Save login & role to localStorage
  function saveLogin() {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(currentUser));
    localStorage.setItem(STORAGE_KEYS.CURRENT_ROLE, currentRole);
  }
  // Load login & role
  function loadLogin() {
    const savedUser = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (savedUser) currentUser = JSON.parse(savedUser);
    const savedRole = localStorage.getItem(STORAGE_KEYS.CURRENT_ROLE);
    if (savedRole) currentRole = savedRole;
  }
  // Clear login state
  function clearLogin() {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_ROLE);
    currentUser = null;
    currentRole = null;
  }

  // Render login form (username + password)
  function renderLogin() {
    showHeaderButtons(false);
    setMainHTML(`
      <form id="loginForm">
        <h2>登入</h2>
        <label for="username">使用者名稱</label>
        <input type="text" id="username" placeholder="輸入使用者名稱" required />
        <label for="password">密碼</label>
        <input type="password" id="password" placeholder="輸入密碼" required />
        <button type="submit" style="margin-top:1rem;">登入</button>
        <button type="button" id="showRegisterBtn" style="margin-top:1rem; margin-left:0.5rem; background:var(--secondary-color);">註冊</button>
        <button type="button" id="forgotPwdBtn" style="margin-top:1rem; margin-left:0.5rem; background:#00bcd4;">忘記密碼</button>
        <p id="loginError" class="error" style="display:none;"></p>
      </form>
    `);

    document.getElementById('loginForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const username = document.getElementById('username').value.trim();
      const password = document.getElementById('password').value;

      const user = users.find(u => u.username === username && u.password === password);
      const errorEl = document.getElementById('loginError');
      if (user) {
        currentUser = user;
        errorEl.style.display = 'none';
        currentRole = null;
        saveLogin();
        loadData();
        showHeaderButtons(true);
        if(user.roles.length === 1){
          // If only one role, auto select
          currentRole = user.roles[0];
          saveLogin();
          renderDashboard();
        } else {
          renderRoleSelection();
        }
      } else {
        errorEl.textContent = '帳號或密碼錯誤，請重新輸入';
        errorEl.style.display = 'block';
      }
    });

    document.getElementById('showRegisterBtn').onclick = renderRegister;
    document.getElementById('forgotPwdBtn').onclick = renderForgotPassword;
  }

  // 忘記密碼流程
  function renderForgotPassword() {
    showHeaderButtons(false);
    setMainHTML(`
      <form id="forgotPwdForm">
        <h2>忘記密碼</h2>
        <label for="fpUsername">使用者名稱</label>
        <input type="text" id="fpUsername" placeholder="請輸入帳號" required />
        <label for="fpPhone">手機號碼</label>
        <input type="text" id="fpPhone" placeholder="請輸入手機號碼" required />
        <button type="button" id="getCodeBtn" style="margin-top:1rem;">取得驗證碼</button>
        <div id="codeSection" style="display:none; margin-top:1rem;">
          <label for="fpCode">驗證碼</label>
          <input type="text" id="fpCode" maxlength="4" placeholder="輸入4位數驗證碼" required />
          <label for="fpNewPwd">新密碼</label>
          <input type="password" id="fpNewPwd" placeholder="輸入新密碼" required />
          <button type="submit" style="margin-top:1rem;">重設密碼</button>
        </div>
        <button type="button" id="backToLoginBtn" style="margin-top:1rem; margin-left:0.5rem; background:var(--secondary-color);">返回登入</button>
        <p id="fpError" class="error" style="display:none;"></p>
        <p id="fpSuccess" class="success" style="display:none;"></p>
      </form>
    `);

    let sentCode = null;

    document.getElementById('getCodeBtn').onclick = function() {
      const username = document.getElementById('fpUsername').value.trim();
      const phone = document.getElementById('fpPhone').value.trim();
      const err = document.getElementById('fpError');
      err.style.display = 'none';

      if (!username || !phone) {
        err.textContent = '請輸入帳號與手機號碼';
        err.style.display = 'block';
        return;
      }
      // 檢查帳號是否存在
      const user = users.find(u => u.username === username);
      if (!user) {
        err.textContent = '帳號不存在';
        err.style.display = 'block';
        return;
      }
      // 產生4位數驗證碼（實際驗證時只要4位數即可）
      sentCode = ('' + Math.floor(1000 + Math.random() * 9000));
      document.getElementById('codeSection').style.display = 'block';
      err.style.display = 'none';
      alert('驗證碼已發送（測試用：' + sentCode + '，實際輸入任意4位數即可通過）');
    };

    document.getElementById('forgotPwdForm').addEventListener('submit', function(e) {
      e.preventDefault();
      const username = document.getElementById('fpUsername').value.trim();
      const code = document.getElementById('fpCode').value.trim();
      const newPwd = document.getElementById('fpNewPwd').value;
      const err = document.getElementById('fpError');
      const succ = document.getElementById('fpSuccess');
      err.style.display = 'none';
      succ.style.display = 'none';

      if (!code || code.length !== 4 || !/^\d{4}$/.test(code)) {
        err.textContent = '請輸入4位數驗證碼';
        err.style.display = 'block';
        return;
      }
      if (!newPwd) {
        err.textContent = '請輸入新密碼';
        err.style.display = 'block';
        return;
      }
      // 只要4位數即可通過
      const user = users.find(u => u.username === username);
      if (!user) {
        err.textContent = '帳號不存在';
        err.style.display = 'block';
        return;
      }
      user.password = newPwd;
      succ.textContent = '密碼重設成功，請使用新密碼登入';
      succ.style.display = 'block';
      setTimeout(renderLogin, 1200);
    });

    document.getElementById('backToLoginBtn').onclick = renderLogin;
  }

  // 新增：註冊表單
  function renderRegister() {
    showHeaderButtons(false);
    setMainHTML(`
      <form id="registerForm">
        <h2>註冊新帳號</h2>
        <label for="regUsername">使用者名稱</label>
        <input type="text" id="regUsername" placeholder="輸入使用者名稱" required />
        <label for="regPassword">密碼</label>
        <input type="password" id="regPassword" placeholder="輸入密碼" required />
        <label for="regPassword2">確認密碼</label>
        <input type="password" id="regPassword2" placeholder="再次輸入密碼" required />
        <button type="submit" style="margin-top:1rem;">註冊</button>
        <button type="button" id="backToLoginBtn" style="margin-top:1rem; margin-left:0.5rem; background:var(--secondary-color);">返回登入</button>
        <p id="registerError" class="error" style="display:none;"></p>
        <p id="registerSuccess" class="success" style="display:none;"></p>
      </form>
    `);
    document.getElementById('registerForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const username = document.getElementById('regUsername').value.trim();
      const password = document.getElementById('regPassword').value;
      const password2 = document.getElementById('regPassword2').value;
      const err = document.getElementById('registerError');
      const succ = document.getElementById('registerSuccess');
      err.style.display = 'none';
      succ.style.display = 'none';

      if (!username || !password || !password2) {
        err.textContent = '所有欄位皆為必填';
        err.style.display = 'block';
        return;
      }
      if (password !== password2) {
        err.textContent = '兩次密碼輸入不一致';
        err.style.display = 'block';
        return;
      }
      if (users.find(u => u.username === username)) {
        err.textContent = '使用者名稱已被使用';
        err.style.display = 'block';
        return;
      }
      // 新增帳號（角色為一般使用者）
      const newUser = {username, password, roles: ['spectator']};
      users.push(newUser);
      succ.textContent = '註冊成功，將自動登入...';
      succ.style.display = 'block';
      // 自動登入
      setTimeout(() => {
        currentUser = newUser;
        currentRole = 'spectator';
        saveLogin();
        renderDashboard();
      }, 800);
    });
    document.getElementById('backToLoginBtn').onclick = renderLogin;
  }

  // Role selection UI after login if multiple roles
  function renderRoleSelection() {
    if(!currentUser) {
      renderLogin();
      return;
    }
    showHeaderButtons(true);
    setMainHTML(`
      <h2>選擇身分組</h2>
      <ul class="role-list" id="roleList"></ul>
    `);
    const ul = document.getElementById('roleList');
    currentUser.roles.forEach(role => {
      const li = document.createElement('li');
      const roleName = roleNameDisplay(role);
      const btn = document.createElement('button');
      btn.textContent = roleName;
      btn.style.flexGrow = '1';
      btn.onclick = () => {
        currentRole = role;
        saveLogin();
        renderDashboard();
      };
      li.appendChild(btn);
      ul.appendChild(li);
    });
  }

  function roleNameDisplay(role){
    switch(role){
      case 'admin': return '管理者';
      case 'organizer': return '主辦方';
      case 'spectator': return '一般使用者';
      default: return role;
    }
  }

  // Render dashboard based on role
  function renderDashboard() {
    if(!currentUser || !currentRole){
      renderLogin();
      return;
    }
    switch(currentRole){
      case 'admin':
        renderAdminDashboard();
        break;
      case 'organizer':
        renderOrganizerDashboard();
        break;
      case 'spectator':
        renderSpectatorDashboard();
        break;
      default:
        setMainHTML(`<p>未知角色：${currentRole}</p>`);
    }
  }

  // ------------------ Admin dashboard ----------------------
  // Admin: manage venues, ticketing, accounting, users

  function renderAdminDashboard(){
    setMainHTML(`
    <h2>管理者控制台</h2>
    <nav style="margin-bottom: 1rem;">
      <button id="adminUsersBtn">使用者帳號管理</button>
      <button id="adminVenuesBtn">場地管理</button>
      <button id="adminTicketsBtn">票務管理</button>
      <button id="adminAccountingBtn">帳務管理</button>
      <button id="adminRefundBtn">退票審核</button>
    </nav>
    <section id="adminContent">
    </section>
    `);
    document.getElementById('adminUsersBtn').onclick = () => renderAdminUsers();
    document.getElementById('adminVenuesBtn').onclick = () => renderAdminVenues();
    document.getElementById('adminTicketsBtn').onclick = () => renderAdminTickets();
    document.getElementById('adminAccountingBtn').onclick = () => renderAdminAccounting();
    document.getElementById('adminRefundBtn').onclick = () => renderRefundReview();

    // Default show users
    renderAdminUsers();
  }

  // Admin manage users
  function renderAdminUsers(){
    const container = document.getElementById('adminContent');
    container.innerHTML = `
      <h3>使用者帳號管理</h3>
      <ul class="user-list" id="userList"></ul>
      <form id="addUserForm" style="margin-top:1rem; max-width:400px;">
        <h4>新增使用者</h4>
        <label for="newUsername">使用者名稱</label>
        <input type="text" id="newUsername" required />
        <label for="newPassword">密碼</label>
        <input type="password" id="newPassword" required />
        <label for="newRoles">身分組</label>
        <select id="newRoles" multiple required style="height: 120px;">
          <option value="admin">管理者</option>
          <option value="organizer">主辦方</option>
          <option value="spectator">一般使用者</option>
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
      const select = document.getElementById('newRoles');
      const roles = Array.from(select.selectedOptions).map(o => o.value);
      const msg = document.getElementById('addUserMsg');
      const err = document.getElementById('addUserError');
      msg.style.display = 'none';
      err.style.display = 'none';

      if(users.find(u => u.username === username)) {
        err.textContent = '使用者名稱已被使用';
        err.style.display = 'block';
        return;
      }
      if(!username || !password || roles.length===0) {
        err.textContent = '所有欄位皆為必填且需選擇身分組';
        err.style.display = 'block';
        return;
      }
      users.push({username, password, roles});
      msg.textContent = '新增成功！';
      msg.style.display = 'block';
      e.target.reset();
      renderUserListAdmin();
    });
  }
  function renderUserListAdmin(){
    const ul = document.getElementById('userList');
    ul.innerHTML = '';
    users.forEach(u => {
      const li = document.createElement('li');
      const roleLabels = u.roles.map(r => roleNameDisplay(r)).join(', ');
      li.textContent = `${u.username} (${roleLabels})`;
      if(u.username !== currentUser.username){
        const btn = document.createElement('button');
        btn.className = 'small-btn';
        btn.textContent = '刪除';
        btn.onclick = () => {
          if(confirm(`確定要刪除使用者 ${u.username} 嗎？`)){
            const idx = users.findIndex(us => us.username === u.username);
            if(idx !== -1){
              users.splice(idx,1);
              renderUserListAdmin();
            }
          }
        };
        li.appendChild(btn);
      }
      ul.appendChild(li);
    });
  }

  // Admin manage venues
  function renderAdminVenues(){
    const container = document.getElementById('adminContent');
    container.innerHTML = `
      <h3>場地管理</h3>
      <ul class="venue-list" id="venueList"></ul>
      <form id="addVenueForm" style="margin-top:1rem; max-width:400px;">
        <h4>新增場地</h4>
        <label for="venueName">場地名稱</label>
        <input type="text" id="venueName" required />
        <label for="venueLocation">地點</label>
        <input type="text" id="venueLocation" required />
        <label for="venueCapacity">容量</label>
        <input type="number" id="venueCapacity" min="1" required />
        <label for="venueImage">圖片</label>
        <input type="file" id="venueImage" accept="image/*" />
        <button type="submit" style="margin-top:1rem;">新增場地</button>
        <p id="addVenueMsg" class="success" style="display:none;"></p>
        <p id="addVenueError" class="error" style="display:none;"></p>
      </form>
    `;
    renderVenueList();
    document.getElementById('addVenueForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('venueName').value.trim();
      const location = document.getElementById('venueLocation').value.trim();
      const capacity = parseInt(document.getElementById('venueCapacity').value);
      const imageFile = document.getElementById('venueImage').files[0];
      const msg = document.getElementById('addVenueMsg');
      const err = document.getElementById('addVenueError');
      msg.style.display = 'none';
      err.style.display = 'none';

      if(!name || !location || !capacity || capacity < 1) {
        err.textContent = '所有欄位皆為必填且容量需大於0';
        err.style.display = 'block';
        return;
      }
      const id = venues.length ? Math.max(...venues.map(v=>v.id))+1 : 1;
      let image = '';
      if(imageFile){
        const fd = new FormData();
        fd.append('image', imageFile);
        const resp = await fetch('/api/upload', {method:'POST', body: fd});
        const result = await resp.json();
        image = '/uploads/' + result.filename;
      }
      venues.push({id, name, location, capacity, image});
      saveData();
      msg.textContent = '新增場地成功！';
      msg.style.display = 'block';
      e.target.reset();
      renderVenueList();
    });
  }
  function renderVenueList(){
    const ul = document.getElementById('venueList');
    ul.innerHTML = '';
    venues.forEach(v => {
      const li = document.createElement('li');
      li.innerHTML = `
        <div style="flex-grow:1;">
          <strong>${v.name}</strong> <br/>
          地點: ${v.location} | 容量: ${v.capacity}
          ${v.image ? `<br/><img src="${v.image}" style="max-width:100%;height:auto;">` : ''}
        </div>
      `;
      const delBtn = document.createElement('button');
      delBtn.className = 'small-btn';
      delBtn.textContent = '刪除';
      delBtn.onclick = () => {
        if(confirm(`確定要刪除場地「${v.name}」嗎？此操作不會自動移除相關演唱會。`)) {
          const idx = venues.findIndex(venue => venue.id === v.id);
          if(idx !== -1){
            venues.splice(idx,1);
            saveData();
            renderVenueList();
          }
        }
      };
      li.appendChild(delBtn);
      ul.appendChild(li);
    });
  }

  // Admin manage tickets - show concerts, possibly allow editing concert ticket info
  function renderAdminTickets(){
    const container = document.getElementById('adminContent');
    container.innerHTML = `
      <h3>票務管理</h3>
      <ul class="concert-list" id="concertList"></ul>
      <form id="addConcertForm" style="margin-top:1rem; max-width:400px;">
        <h4>新增演唱會</h4>
        <label for="concertTitle">標題</label>
        <input type="text" id="concertTitle" required />
        <label for="concertDates">日期 (可逗號分隔)</label>
        <input type="text" id="concertDates" placeholder="YYYY-MM-DD,YYYY-MM-DD" required />
        <label for="saleStart">開賣日期</label>
        <input type="date" id="saleStart" required />
        <label for="saleEnd">結束日期</label>
        <input type="date" id="saleEnd" required />
        <label for="concertVenue">場地</label>
        <select id="concertVenue" required>
          <option value="" disabled selected>請選擇場地</option>
        </select>
        <fieldset style="margin-top:1rem;">
          <legend>區域及票價</legend>
          <label for="rockPrice">搖滾區票價</label>
          <input type="number" id="rockPrice" min="0" required />
          <label for="rockQty">搖滾區數量</label>
          <input type="number" id="rockQty" min="0" required />
          <label for="hotPrice">熱區票價</label>
          <input type="number" id="hotPrice" min="0" required />
          <label for="hotQty">熱區數量</label>
          <input type="number" id="hotQty" min="0" required />
          <label for="normalPrice">一般區票價</label>
          <input type="number" id="normalPrice" min="0" required />
        <label for="normalQty">一般區數量</label>
        <input type="number" id="normalQty" min="0" required />
        <label for="concertImage">圖片</label>
        <input type="file" id="concertImage" accept="image/*" />
      </fieldset>
        <button type="submit" style="margin-top:1rem;">新增演唱會</button>
        <p id="addConcertMsg" class="success" style="display:none;"></p>
        <p id="addConcertError" class="error" style="display:none;"></p>
      </form>
    `;
    renderConcertVenueOptions();
    renderConcertListAdmin();
    document.getElementById('addConcertForm').addEventListener('submit', async e=>{
      e.preventDefault();
      const title = document.getElementById('concertTitle').value.trim();
      const dates = document.getElementById('concertDates').value.split(',').map(d=>d.trim()).filter(d=>d);
      const saleStart = document.getElementById('saleStart').value;
      const saleEnd = document.getElementById('saleEnd').value;
      const venueId = parseInt(document.getElementById('concertVenue').value);
      const imageFile = document.getElementById('concertImage').files[0];
      const rockPrice = parseInt(document.getElementById('rockPrice').value);
      const rockQty = parseInt(document.getElementById('rockQty').value);
      const hotPrice = parseInt(document.getElementById('hotPrice').value);
      const hotQty = parseInt(document.getElementById('hotQty').value);
      const normalPrice = parseInt(document.getElementById('normalPrice').value);
      const normalQty = parseInt(document.getElementById('normalQty').value);
      const ticketsAvailable = rockQty + hotQty + normalQty;
      const msg = document.getElementById('addConcertMsg');
      const err = document.getElementById('addConcertError');
      msg.style.display = 'none';
      err.style.display = 'none';

      if(!title || dates.length===0 || !venueId || !saleStart || !saleEnd ||
         isNaN(rockPrice) || isNaN(rockQty) ||
         isNaN(hotPrice) || isNaN(hotQty) ||
         isNaN(normalPrice) || isNaN(normalQty)) {
        err.textContent = '所有欄位皆為必填且需有效';
        err.style.display = 'block';
        return;
      }
      const venue = venues.find(v => v.id === venueId);
      if(!venue){
        err.textContent = '選擇的場地不存在';
        err.style.display = 'block';
        return;
      }
      // Validate ticketsAvailable not exceed venue capacity
      if(ticketsAvailable > venue.capacity){
        err.textContent = `可售票數量不可超過場地容量 (${venue.capacity})`;
        err.style.display = 'block';
        return;
      }

      const id = concerts.length ? Math.max(...concerts.map(c => c.id)) + 1 : 1;
      const zones = [
        {name: '搖滾區', price: rockPrice, capacity: rockQty, sold: 0},
        {name: '熱區', price: hotPrice, capacity: hotQty, sold: 0},
        {name: '一般區', price: normalPrice, capacity: normalQty, sold: 0}
      ];
      let image = '';
      if(imageFile){
        const fd = new FormData();
        fd.append('image', imageFile);
        const resp = await fetch('/api/upload', {method:'POST', body: fd});
        const result = await resp.json();
        image = '/uploads/' + result.filename;
      }
      concerts.push({id, title, dates, saleStart, saleEnd, venueId, image, ticketsAvailable, ticketsSold: 0, zones});
      saveData();
      msg.textContent = '新增演唱會成功！';
      msg.style.display = 'block';
      e.target.reset();
      renderConcertListAdmin();
    });
  }
  function renderConcertVenueOptions(){
    const select = document.getElementById('concertVenue');
    select.innerHTML = `<option value="" disabled selected>請選擇場地</option>`;
    venues.forEach(v=>{
      const option = document.createElement('option');
      option.value = v.id;
      option.textContent = `${v.name} (${v.location}) 容量:${v.capacity}`;
      select.appendChild(option);
    });
  }
  function renderConcertListAdmin(){
    const ul = document.getElementById('concertList');
    ul.innerHTML = '';
    concerts.forEach(c => {
      const venue = venues.find(v => v.id === c.venueId);
      const venueName = venue ? venue.name : '已刪除場地';
      const li = document.createElement('li');
      const zoneInfo = c.zones.map(z=>`${z.name} NT$${z.price} 剩餘 ${z.capacity - z.sold}`).join('<br/>');
      li.innerHTML = `
        <div style="flex-grow:1;">
          <strong>${c.title}</strong><br/>
          ${c.image ? `<img src="${c.image}" style="width:100%;max-height:150px;object-fit:cover;">` : ''}
          日期: ${c.dates.join(' , ')} | 場地: ${venueName} <br/>
          售票期間: ${c.saleStart} ~ ${c.saleEnd}<br/>
          ${zoneInfo}
        </div>
      `;
      const delBtn = document.createElement('button');
      delBtn.className = 'small-btn';
      delBtn.textContent = '刪除';
      delBtn.onclick = () => {
        if(confirm(`確定刪除演唱會「${c.title}」？此操作不會自動退還已賣票券。`)){
          const idx = concerts.findIndex(con => con.id === c.id);
          if(idx !== -1){
            concerts.splice(idx,1);
            saveData();
            renderConcertListAdmin();
          }
        }
      };
      li.appendChild(delBtn);
      ul.appendChild(li);
    });
  }

  // Admin accounting: show summary of tickets sold and revenue
  function renderAdminAccounting(){
    const container = document.getElementById('adminContent');
    container.innerHTML = `<h3>帳務管理</h3>
      <table style="width:100%; border-collapse: collapse;" border="1" cellpadding="5" cellspacing="0">
        <thead>
          <tr style="background: var(--primary-color); color:white;">
            <th>演唱會</th>
            <th>票價 (NT$)</th>
            <th>已售票數</th>
            <th>收入 (NT$)</th>
          </tr>
        </thead>
        <tbody id="accountingBody"></tbody>
        <tfoot style="font-weight:bold;">
          <tr>
            <td colspan="3" style="text-align:right;">總收入：</td>
            <td id="totalRevenue">NT$0</td>
          </tr>
        </tfoot>
      </table>`;
    const tbody = document.getElementById('accountingBody');
    tbody.innerHTML = '';
    let total = 0;
    concerts.forEach(c => {
      const revenue = c.zones.reduce((sum,z)=>sum + z.sold * z.price,0);
      const sold = c.zones.reduce((sum,z)=>sum + z.sold,0);
      total += revenue;
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${c.title}</td>
        <td>-</td>
        <td>${sold}</td>
        <td>${revenue}</td>
      `;
      tbody.appendChild(tr);
    });
    document.getElementById('totalRevenue').textContent = `NT$${total}`;
  }

  // ------------------ Organizer dashboard ----------------------
  // Organizer: manage tickets and accounting (similar to admin but less features)

  function renderOrganizerDashboard(){
    setMainHTML(`
    <h2>主辦方控制台</h2>
    <nav style="margin-bottom: 1rem;">
      <button id="orgTicketsBtn">票務管理</button>
      <button id="orgAccountingBtn">帳務管理</button>
    </nav>
    <section id="organizerContent"></section>
    `);
    document.getElementById('orgTicketsBtn').onclick = () => renderOrgTickets();
    document.getElementById('orgAccountingBtn').onclick = () => renderOrgAccounting();

    // Default show tickets
    renderOrgTickets();
  }

  // Organizer tickets management: show concerts and add
  function renderOrgTickets(){
    const container = document.getElementById('organizerContent');
    container.innerHTML = `
      <h3>票務管理</h3>
      <ul class="concert-list" id="concertList"></ul>
      <form id="addConcertForm" style="margin-top:1rem; max-width:400px;">
        <h4>新增演唱會</h4>
        <label for="concertTitle">標題</label>
        <input type="text" id="concertTitle" required />
        <label for="concertDates">日期 (可逗號分隔)</label>
        <input type="text" id="concertDates" placeholder="YYYY-MM-DD,YYYY-MM-DD" required />
        <label for="saleStart">開賣日期</label>
        <input type="date" id="saleStart" required />
        <label for="saleEnd">結束日期</label>
        <input type="date" id="saleEnd" required />
        <label for="concertVenue">場地</label>
        <select id="concertVenue" required>
          <option value="" disabled selected>請選擇場地</option>
        </select>
        <fieldset style="margin-top:1rem;">
          <legend>區域及票價</legend>
          <label for="rockPriceOrg">搖滾區票價</label>
          <input type="number" id="rockPriceOrg" min="0" required />
          <label for="rockQtyOrg">搖滾區數量</label>
          <input type="number" id="rockQtyOrg" min="0" required />
          <label for="hotPriceOrg">熱區票價</label>
          <input type="number" id="hotPriceOrg" min="0" required />
          <label for="hotQtyOrg">熱區數量</label>
          <input type="number" id="hotQtyOrg" min="0" required />
          <label for="normalPriceOrg">一般區票價</label>
          <input type="number" id="normalPriceOrg" min="0" required />
          <label for="normalQtyOrg">一般區數量</label>
          <input type="number" id="normalQtyOrg" min="0" required />
          <label for="concertImage">圖片</label>
          <input type="file" id="concertImage" accept="image/*" />
        </fieldset>
        <button type="submit" style="margin-top:1rem;">新增演唱會</button>
        <p id="addConcertMsg" class="success" style="display:none;"></p>
        <p id="addConcertError" class="error" style="display:none;"></p>
      </form>
    `;
    renderConcertVenueOptions();
    renderConcertListOrganizer();
    document.getElementById('addConcertForm').addEventListener('submit', async e=>{
      e.preventDefault();
      const title = document.getElementById('concertTitle').value.trim();
      const dates = document.getElementById('concertDates').value.split(',').map(d=>d.trim()).filter(d=>d);
      const saleStart = document.getElementById('saleStart').value;
      const saleEnd = document.getElementById('saleEnd').value;
      const venueId = parseInt(document.getElementById('concertVenue').value);
      const rockPrice = parseInt(document.getElementById('rockPriceOrg').value);
      const rockQty = parseInt(document.getElementById('rockQtyOrg').value);
      const hotPrice = parseInt(document.getElementById('hotPriceOrg').value);
      const hotQty = parseInt(document.getElementById('hotQtyOrg').value);
      const normalPrice = parseInt(document.getElementById('normalPriceOrg').value);
      const normalQty = parseInt(document.getElementById('normalQtyOrg').value);
      const ticketsAvailable = rockQty + hotQty + normalQty;
      const msg = document.getElementById('addConcertMsg');
      const err = document.getElementById('addConcertError');
      msg.style.display = 'none';
      err.style.display = 'none';

      if(!title || dates.length===0 || !venueId || !saleStart || !saleEnd ||
          isNaN(rockPrice) || isNaN(rockQty) ||
          isNaN(hotPrice) || isNaN(hotQty) ||
          isNaN(normalPrice) || isNaN(normalQty)) {
        err.textContent = '所有欄位皆為必填且需有效';
        err.style.display = 'block';
        return;
      }
      const venue = venues.find(v => v.id === venueId);
      if(!venue){
        err.textContent = '選擇的場地不存在';
        err.style.display = 'block';
        return;
      }
      if(ticketsAvailable > venue.capacity){
        err.textContent = `可售票數量不可超過場地容量 (${venue.capacity})`;
        err.style.display = 'block';
        return;
      }

      const id = concerts.length ? Math.max(...concerts.map(c => c.id))+1 : 1;
      const zones = [
        {name: '搖滾區', price: rockPrice, capacity: rockQty, sold: 0},
        {name: '熱區', price: hotPrice, capacity: hotQty, sold: 0},
        {name: '一般區', price: normalPrice, capacity: normalQty, sold: 0}
      ];
      let image = '';
      if(imageFile){
        const fd = new FormData();
        fd.append('image', imageFile);
        const resp = await fetch('/api/upload', {method:'POST', body: fd});
        const result = await resp.json();
        image = '/uploads/' + result.filename;
      }
      concerts.push({id, title, dates, saleStart, saleEnd, venueId, image, ticketsAvailable, ticketsSold: 0, zones});
      saveData();
      msg.textContent = '新增演唱會成功！';
      msg.style.display = 'block';
      e.target.reset();
      renderConcertListOrganizer();
    });
  }
  function renderConcertListOrganizer(){
    const ul = document.getElementById('concertList');
    ul.innerHTML = '';
    concerts.forEach(c=>{
      const venue = venues.find(v=>v.id===c.venueId);
      const venueName = venue ? venue.name : '已刪除場地';
      const li = document.createElement('li');
      const zoneInfo = c.zones.map(z=>`${z.name} NT$${z.price} 剩餘 ${z.capacity - z.sold}`).join('<br/>');
      li.innerHTML = `
        <div style="flex-grow:1;">
          <strong>${c.title}</strong><br/>
          ${c.image ? `<img src="${c.image}" style="width:100%;max-height:150px;object-fit:cover;">` : ''}
          日期: ${c.dates.join(' , ')} | 場地: ${venueName} <br/>
          售票期間: ${c.saleStart} ~ ${c.saleEnd}<br/>
          ${zoneInfo}
        </div>
      `;
      ul.appendChild(li);
    });
  }
  // Organizer accounting - similar to admin accounting but no edit
  function renderOrgAccounting(){
    mainContent.querySelector('#organizerContent').innerHTML = `<h3>帳務管理</h3>
      <table style="width:100%; border-collapse: collapse;" border="1" cellpadding="5" cellspacing="0">
        <thead>
          <tr style="background: var(--primary-color); color:white;">
            <th>演唱會</th>
            <th>票價 (NT$)</th>
            <th>已售票數</th>
            <th>收入 (NT$)</th>
          </tr>
        </thead>
        <tbody id="orgAccountingBody"></tbody>
        <tfoot style="font-weight:bold;">
          <tr>
            <td colspan="3" style="text-align:right;">總收入：</td>
            <td id="orgTotalRevenue">NT$0</td>
          </tr>
        </tfoot>
      </table>`;
    const tbody = document.getElementById('orgAccountingBody');
    tbody.innerHTML = '';
    let total = 0;
    concerts.forEach(c=>{
      const revenue = c.zones.reduce((sum,z)=>sum + z.sold * z.price,0);
      const sold = c.zones.reduce((sum,z)=>sum + z.sold,0);
      total += revenue;
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${c.title}</td>
        <td>-</td>
        <td>${sold}</td>
        <td>${revenue}</td>
      `;
      tbody.appendChild(tr);
    });
    document.getElementById('orgTotalRevenue').textContent = `NT$${total}`;
  }

  // ------------------ Spectator dashboard ----------------------
  // Spectator: buy tickets, refund tickets

  function renderSpectatorDashboard(){
    setMainHTML(`
      <h2>一般使用者專區</h2>
      <section>
        <h3>演唱會列表</h3>
        <ul class="concert-list" id="spectatorConcertList"></ul>
      </section>
      <section style="margin-top: 2rem;">
        <h3>我的票券</h3>
        <ul class="tickets-list" id="myTicketsList"></ul>
      </section>
    `);
    renderConcertsForSpectator();
    renderMyTickets();
  }

  // Show concerts with buy button if available
  function renderConcertsForSpectator(){
    const ul = document.getElementById('spectatorConcertList');
    ul.innerHTML = '';
    concerts.forEach(c => {
      const venue = venues.find(v => v.id === c.venueId);
      const venueName = venue ? venue.name : '已刪除場地';
      const li = document.createElement('li');
      const zoneInfo = c.zones.map(z=>`${z.name} NT$${z.price} 剩餘 ${z.capacity - z.sold}`).join(' | ');
      const totalLeft = c.zones.reduce((sum,z)=>sum+(z.capacity - z.sold),0);
      li.innerHTML = `
        <div style="flex-grow:1;">
          <strong>${c.title}</strong><br/>
          ${c.image ? `<img src="${c.image}" style="width:100%;max-height:150px;object-fit:cover;">` : ''}
          日期: ${c.dates.join(' , ')} | 場地: ${venueName} <br/>
          售票期間: ${c.saleStart} ~ ${c.saleEnd}<br/>
          ${zoneInfo}
        </div>
      `;
      if(totalLeft > 0){
        const buyBtn = document.createElement('button');
        buyBtn.textContent = '購買';
        buyBtn.onclick = ()=> showBuyTicketModal(c);
        li.appendChild(buyBtn);
      } else {
        const soldOut = document.createElement('span');
        soldOut.textContent = '已售完';
        soldOut.style.color = '#e53935';
        soldOut.style.fontWeight = '600';
        soldOut.style.marginLeft = '0.5rem';
      li.appendChild(soldOut);
      }
      ul.appendChild(li);
    });
  }

  // Generate seat numbers sequentially per zone
  function generateSeatNumbers(concertId, zoneName, qty){
    const concert = concerts.find(c=>c.id===concertId);
    if(!concert) return [];
    const zone = concert.zones.find(z=>z.name===zoneName);
    if(!zone) return [];
    const start = zone.sold + 1;
    const seats = [];
    for(let i=0;i<qty;i++){
      seats.push(start + i);
    }
    return seats;
  }

  // Show user ticket list with refund button
  function renderMyTickets(){
    const ul = document.getElementById('myTicketsList');
    ul.innerHTML = '';
    const myTickets = tickets.filter(t => t.username === currentUser.username);
    if(myTickets.length === 0){
      ul.innerHTML = '<li>目前尚無票券</li>';
      return;
    }
    myTickets.forEach(t => {
      const concert = concerts.find(c => c.id === t.concertId);
      if(!concert) return;
      const li = document.createElement('li');
      li.innerHTML = `
        <div style="flex-grow:1;">
          <strong>${concert.title}</strong><br/>
          日期: ${concert.dates.join(' , ')} | 場地: ${venues.find(v=>v.id===concert.venueId)?.name ?? '已刪除場地'} <br/>
          區域: ${t.zone} | 票數: ${t.quantity} 張<br/>
          座位: ${(t.seatNumbers||[]).join(', ')}<br/>
          購買日期: ${new Date(t.purchaseDate).toLocaleDateString()}
          ${t.status === 'refund_pending' ? `<div class="info" style="color:#e67e22;">退票審核中 (${t.refundRequest} 張)</div>` : ''}
        </div>
      `;
      // 只有正常票券可申請退票
      if(t.status !== 'refund_pending'){
        const refundBtn = document.createElement('button');
        refundBtn.className = 'small-btn';
        refundBtn.textContent = '退票';
        refundBtn.onclick = () => {
          showRefundModal(t, concert);
        };
        li.appendChild(refundBtn);
      }
      ul.appendChild(li);
    });
  }

  // Modal buy tickets
  function showBuyTicketModal(concert){
    const modal = createModal();
    const zoneOptions = concert.zones.map(z=>`<option value="${z.name}">${z.name} NT$${z.price} (剩 ${z.capacity - z.sold})</option>`).join('');
    let currentZone = concert.zones[0];
    let ticketsLeft = currentZone.capacity - currentZone.sold;
    modal.box.innerHTML = `
      <h3>購買票券 - ${concert.title}</h3>
      <label for="buyZone">選擇區域</label>
      <select id="buyZone" style="width:100%;">${zoneOptions}</select>
      <label for="ticketQuantity">購買數量 (剩餘 ${ticketsLeft} 張)</label>
      <input type="number" id="ticketQuantity" min="1" max="${ticketsLeft}" value="1" style="width:100%; padding:0.5rem; font-size:1rem;" />
      <label for="payMethod" style="margin-top:1rem;">選擇支付方式</label>
      <select id="payMethod" style="width:100%; margin-top:0.25rem;">
        <option value="credit">信用卡</option>
        <option value="linepay">Line Pay</option>
        <option value="atm">ATM轉帳</option>
      </select>
      <div id="payFields" style="margin-top:1rem;"></div>
      <p id="buyError" class="error" style="display:none;"></p>
      <div style="margin-top:1rem; text-align:right;">
        <button id="cancelBtn" style="margin-right:0.5rem; background:#888;">取消</button>
        <button id="confirmBtn">確定購買</button>
      </div>
    `;

    function renderPayFields() {
      const method = modal.box.querySelector('#payMethod').value;
      const payFields = modal.box.querySelector('#payFields');
      if(method === 'credit'){
        payFields.innerHTML = `
          <label for="cardNum">信用卡號</label>
          <input type="text" id="cardNum" maxlength="16" placeholder="請輸入16位數字" />
          <label for="cardExp">有效期限(月/年)</label>
          <input type="text" id="cardExp" maxlength="5" placeholder="MM/YY" />
          <label for="cardCVC">安全碼</label>
          <input type="text" id="cardCVC" maxlength="3" placeholder="CVC" />
        `;
      } else if(method === 'linepay'){
        payFields.innerHTML = `
          <div class="info">將跳轉至 Line Pay 完成付款</div>
        `;
      } else if(method === 'atm'){
        // 假銀行資訊
        payFields.innerHTML = `
          <div id="atmInfo" style="background:#f0f0f0; padding:1rem; border-radius:8px; margin-bottom:1rem;">
            <strong>銀行代碼：</strong> 822<br>
            <strong>轉帳帳號：</strong> 1234-5678-9000-8888
          </div>
        `;
      }
    }
    renderPayFields();
    modal.box.querySelector('#payMethod').onchange = renderPayFields;
    const zoneSelect = modal.box.querySelector('#buyZone');
    zoneSelect.onchange = () => {
      currentZone = concert.zones.find(z=>z.name === zoneSelect.value);
      ticketsLeft = currentZone.capacity - currentZone.sold;
      const qtyInput = modal.box.querySelector('#ticketQuantity');
      qtyInput.max = ticketsLeft;
      qtyInput.value = ticketsLeft > 0 ? 1 : 0;
      modal.box.querySelector('label[for="ticketQuantity"]').textContent = `購買數量 (剩餘 ${ticketsLeft} 張)`;
    };

    modal.cancelBtn.onclick = () => {
      removeModal(modal.overlay);
    };

    modal.confirmBtn.onclick = () => {
      const quantity = parseInt(modal.box.querySelector('#ticketQuantity').value);
      const buyError = modal.box.querySelector('#buyError');
      const method = modal.box.querySelector('#payMethod').value;
      buyError.style.display = 'none';

      if(isNaN(quantity) || quantity<1){
        buyError.textContent = '請輸入有效購買數量';
        buyError.style.display = 'block';
        return;
      }
      if(quantity > ticketsLeft){
        buyError.textContent = `最多可購買 ${ticketsLeft} 張票`;
        buyError.style.display = 'block';
        return;
      }

      if(method === 'credit'){
        const cardNum = modal.box.querySelector('#cardNum').value.trim();
        const cardExp = modal.box.querySelector('#cardExp').value.trim();
        const cardCVC = modal.box.querySelector('#cardCVC').value.trim();
        if(!/^\d{16}$/.test(cardNum)){
          buyError.textContent = '請輸入正確的16位數信用卡號';
          buyError.style.display = 'block';
          return;
        }
        if(!/^\d{2}\/\d{2}$/.test(cardExp)){
          buyError.textContent = '請輸入正確的有效期限 (MM/YY)';
          buyError.style.display = 'block';
          return;
        }
        if(!/^\d{3}$/.test(cardCVC)){
          buyError.textContent = '請輸入正確的安全碼';
          buyError.style.display = 'block';
          return;
        }
        // 直接完成購買
        finishPurchase();
      } else if(method === 'linepay'){
        // 模擬跳轉
        modal.box.innerHTML = `
          <h3>Line Pay 支付</h3>
          <p>正在跳轉至Line Pay付款頁面...</p>
          <div class="info" style="margin-top:1rem;">請勿關閉視窗，付款完成後將自動返回。</div>
        `;
        setTimeout(() => {
          finishPurchase();
        }, 5000);
      } else if(method === 'atm'){
        // 顯示ATM資訊與立即繳費按鈕
        modal.box.innerHTML = `
          <h3>ATM 轉帳繳費</h3>
          <div style="background:#f0f0f0; padding:1rem; border-radius:8px; margin-bottom:1rem;">
            <strong>銀行代碼：</strong> 822<br>
            <strong>轉帳帳號：</strong> 1234-5678-9000-8888
          </div>
          <div class="info" style="margin-bottom:1rem;">請於期限內完成轉帳，否則訂單將自動取消。</div>
          <div style="text-align:right;">
            <button id="atmPayBtn" style="background:var(--primary-color);">立即繳費</button>
          </div>
        `;
        modal.box.querySelector('#atmPayBtn').onclick = function(){
          modal.box.innerHTML = `
            <h3>ATM 轉帳繳費</h3>
            <p>正在確認您的轉帳紀錄...</p>
            <div class="info" style="margin-top:1rem;">請勿關閉視窗，完成後將自動返回。</div>
          `;
          setTimeout(() => {
            finishPurchase();
          }, 5000);
        };
      }

      function finishPurchase(){
        currentZone.sold += quantity;
        concert.ticketsSold = concert.zones.reduce((sum,z)=>sum+z.sold,0);
        let existing = tickets.find(t => t.username === currentUser.username && t.concertId === concert.id && t.zone === currentZone.name);
        const seats = generateSeatNumbers(concert.id, currentZone.name, quantity);
        if(existing){
          existing.quantity += quantity;
          existing.seatNumbers = (existing.seatNumbers||[]).concat(seats);
        } else {
          tickets.push({username: currentUser.username, concertId: concert.id, zone: currentZone.name, quantity, seatNumbers: seats, status: 'normal', purchaseDate: new Date().toISOString()});
        }
        saveData();
        renderConcertsForSpectator();
        renderMyTickets();
        alert(`成功購買 ${quantity} 張票券！`);
        removeModal(modal.overlay);
      }
    };
  }

  // Modal refund tickets
  function showRefundModal(ticket, concert){
    const modal = createModal();
    modal.box.innerHTML = `
      <h3>申請退票 - ${concert.title}</h3>
      <p>您擁有 ${ticket.quantity} 張票</p>
      <label for="refundQuantity">申請退票數量</label><br/>
      <input type="number" id="refundQuantity" min="1" max="${ticket.quantity}" value="1" style="width:100%; padding:0.5rem; font-size:1rem;" />
      <p id="refundError" class="error" style="display:none;"></p>
      <div style="margin-top:1rem; text-align:right;">
        <button id="cancelBtn" style="margin-right:0.5rem; background:#888;">取消</button>
        <button id="confirmBtn">送出退票申請</button>
      </div>
    `;
    modal.cancelBtn.onclick = () => {
      removeModal(modal.overlay);
    };
    modal.confirmBtn.onclick = () => {
      const quantity = parseInt(modal.box.querySelector('#refundQuantity').value);
      const refundError = modal.box.querySelector('#refundError');
      if(isNaN(quantity) || quantity < 1){
        refundError.textContent = '請輸入有效退票數量';
        refundError.style.display = 'block';
        return;
      }
      if(quantity > ticket.quantity){
        refundError.textContent = `最多可退票 ${ticket.quantity} 張`;
        refundError.style.display = 'block';
        return;
      }
      const purchaseDate = new Date(ticket.purchaseDate);
      const daysDiff = (Date.now() - purchaseDate.getTime()) / (1000*60*60*24);
      const concertData = concerts.find(c => c.id === ticket.concertId);
      const zone = concertData ? concertData.zones.find(z=>z.name===ticket.zone) : null;
      if(daysDiff <= 3){
        // Auto refund
        ticket.quantity -= quantity;
        if(ticket.seatNumbers){
          ticket.seatNumbers.splice(0, quantity);
        }
        if(zone){ zone.sold -= quantity; if(zone.sold < 0) zone.sold = 0; }
        concertData.ticketsSold = concertData.zones.reduce((s,z)=>s+z.sold,0);
        if(ticket.quantity === 0){
          const idx = tickets.findIndex(x=>x===ticket);
          if(idx !== -1) tickets.splice(idx,1);
        }
        saveData();
        renderConcertsForSpectator();
        renderMyTickets();
        alert(`已成功退票 ${quantity} 張`);
        removeModal(modal.overlay);
      } else {
        ticket.refundRequest = quantity;
        ticket.status = 'refund_pending';
        saveData();
        renderConcertsForSpectator();
        renderMyTickets();
        alert(`退票申請已送出，請等待審核`);
        removeModal(modal.overlay);
      }
    };
  }

  // Admin refund review
  function renderRefundReview(){
    const container = document.getElementById('adminContent');
    container.innerHTML = `
      <h3>退票審核</h3>
      <ul class="tickets-list" id="refundList"></ul>
    `;
    const ul = document.getElementById('refundList');
    ul.innerHTML = '';
    tickets.filter(t=>t.status==='refund_pending').forEach(t=>{
      const concert = concerts.find(c=>c.id===t.concertId);
      if(!concert) return;
      const li = document.createElement('li');
      li.innerHTML = `
        <div style="flex-grow:1;">
          <strong>${concert.title}</strong><br/>
          區域: ${t.zone}<br/>
          申請人: ${t.username}<br/>
          申請退票數量: ${t.refundRequest} 張
        </div>
      `;
      const approveBtn = document.createElement('button');
      approveBtn.className = 'small-btn';
      approveBtn.textContent = '同意';
      approveBtn.onclick = () => {
        // 實際退票
        t.quantity -= t.refundRequest;
        const concertData = concerts.find(c => c.id === t.concertId);
        if(concertData){
          const zone = concertData.zones.find(z=>z.name===t.zone);
          if(zone){ zone.sold -= t.refundRequest; if(zone.sold < 0) zone.sold = 0; }
          concertData.ticketsSold = concertData.zones.reduce((s,z)=>s+z.sold,0);
        }
        if(t.quantity === 0){
          const idx = tickets.findIndex(x=>x===t);
          if(idx !== -1) tickets.splice(idx,1);
        } else {
          t.status = 'normal';
          delete t.refundRequest;
        }
        saveData();
        renderRefundReview();
      };
      const rejectBtn = document.createElement('button');
      rejectBtn.className = 'small-btn';
      rejectBtn.style.background = '#888';
      rejectBtn.textContent = '拒絕';
      rejectBtn.onclick = () => {
        t.status = 'normal';
        delete t.refundRequest;
        saveData();
        renderRefundReview();
      };
      li.appendChild(approveBtn);
      li.appendChild(rejectBtn);
      ul.appendChild(li);
    });
  }

  // Modal utility functions
  function createModal(){
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    const box = document.createElement('div');
    box.className = 'modal-box';
    overlay.appendChild(box);
    document.body.appendChild(overlay);

    // Buttons references for convenience
    return {
      overlay,
      box,
      get cancelBtn(){ return box.querySelector('#cancelBtn'); },
      get confirmBtn(){ return box.querySelector('#confirmBtn'); },
    };
  }
  function removeModal(modal){
    if(modal && modal.parentElement) {
      modal.parentElement.removeChild(modal);
    }
  }

  // Logout handler
  logoutBtn.addEventListener('click', () => {
    if(confirm('確定要登出嗎？')){
      clearLogin();
      renderLogin();
    }
  });

  exportDbBtn.addEventListener('click', async () => {
    const data = {
      venues, concerts, tickets
    };
    await exportToJSON(data);
  });

  importDbBtn.addEventListener('click', () => dbFileInput.click());
  dbFileInput.addEventListener('change', async (e) => {
    if(e.target.files.length){
      const result = await importFromJSON(e.target.files[0]);
      if(result.venues) venues = result.venues;
      if(result.concerts) concerts = result.concerts;
      if(result.tickets) tickets = result.tickets;
      saveData();
      if(currentRole){
        renderDashboard();
      }
    }
  });

  // Initialization entry point
  export async function initApp() {
    loadLogin();
    await loadData();
    if(currentUser){
      showHeaderButtons(true);
      if(!currentRole){
        if(currentUser.roles.length === 1){
          currentRole = currentUser.roles[0];
          saveLogin();
          renderDashboard();
        } else {
          renderRoleSelection();
        }
      } else {
        renderDashboard();
      }
    } else {
      renderLogin();
    }
  }
