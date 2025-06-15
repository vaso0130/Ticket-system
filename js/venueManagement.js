// Venue Management Module
let mainContentElement;
let appData; // Changed from appDataVenues to appData to access concerts for delete check
let uiHelpers; // Added to store ui helpers like createModal
let saveDataCallback;

export function initVenueManagementModule(contentEl, data, ui, saveDataFn) { // Added ui parameter, changed venuesData to data
    mainContentElement = contentEl;
    appData = data; // Store full appData
    uiHelpers = ui; // Store ui helpers
    saveDataCallback = saveDataFn;
}

export function renderVenueManagementUI() {
    if (!mainContentElement || !appData || !appData.venues || !uiHelpers || !saveDataCallback) { // Check appData.venues
        console.error("Venue Management module not initialized properly.");
        const adminContent = mainContentElement.querySelector('#adminContent') || mainContentElement;
        adminContent.innerHTML = "<p>場地管理模組載入錯誤。</p>";
        return;
    }
    const container = mainContentElement.querySelector('#adminContent') || mainContentElement;
    container.innerHTML = `
    <h3>場地管理</h3>
    <ul class="venue-list" id="venueListMgmt"></ul>
    <form id="addVenueFormMgmt" style="margin-top:1rem; max-width:500px;">
      <h4>新增場地</h4>
      <label for="venueNameMgmt">場地名稱</label>
      <input type="text" id="venueNameMgmt" required />
      <label for="venueLocationMgmt">地點</label>
      <input type="text" id="venueLocationMgmt" required />
      
      <h5>座位分區設定</h5>
      <div id="newVenueSeatMapContainerMgmt" style="padding: 10px; border: 1px solid #eee; margin-bottom:1rem; background-color:#f9f9f9;">
        <!-- Seat section inputs will be added here -->
      </div>
      <button type="button" id="addSeatSectionBtnMgmt" class="btn-secondary" style="margin-bottom:1rem;">新增座位分區</button>
      
      <button type="submit" class="btn-primary" style="margin-top:1rem;">新增場地</button>
      <p id="addVenueMsgMgmt" class="success" style="display:none;"></p>
      <p id="addVenueErrorMgmt" class="error" style="display:none;"></p>
    </form>
  `;
    renderVenueListInternal();
    addSeatSectionInputRow('newVenueSeatMapContainerMgmt'); // Add one section row by default

    document.getElementById('addSeatSectionBtnMgmt').addEventListener('click', () => {
        addSeatSectionInputRow('newVenueSeatMapContainerMgmt');
    });

    document.getElementById('addVenueFormMgmt').addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('venueNameMgmt').value.trim();
        const location = document.getElementById('venueLocationMgmt').value.trim();
        const msg = document.getElementById('addVenueMsgMgmt');
        const err = document.getElementById('addVenueErrorMgmt');
        msg.style.display = 'none';
        err.style.display = 'none';

        if (!name || !location) {
            err.textContent = '場地名稱和地點為必填欄位';
            err.style.display = 'block';
            return;
        }

        const seatMap = [];
        let totalCapacity = 0;
        const sectionRows = document.querySelectorAll('#newVenueSeatMapContainerMgmt .seat-section-row');
        let sectionError = false;
        sectionRows.forEach(row => {
            const sectionIdInput = row.querySelector('.section-id');
            const sectionNameInput = row.querySelector('.section-name');
            const sectionCapacityInput = row.querySelector('.section-capacity');

            if (!sectionIdInput || !sectionNameInput || !sectionCapacityInput) {
                console.error('A section row is missing expected input fields.');
                err.textContent = '座位分區表單結構錯誤，請聯絡管理員。';
                sectionError = true;
                return;
            }

            const sectionId = sectionIdInput.value.trim();
            const sectionName = sectionNameInput.value.trim();
            const sectionCapacity = parseInt(sectionCapacityInput.value);

            if (!sectionId || !sectionName || isNaN(sectionCapacity) || sectionCapacity <= 0) {
                err.textContent = '所有座位分區的ID、名稱為必填，容量必須是大於0的數字。';
                sectionError = true;
                return;
            }
            if (seatMap.some(s => s.id === sectionId)) {
                err.textContent = `座位分區ID \"${sectionId}\" 重複。請確保每個分區ID的唯一性。`;
                sectionError = true;
                return;
            }
            seatMap.push({ id: sectionId, name: sectionName, capacity: sectionCapacity });
            totalCapacity += sectionCapacity;
        });

        if (sectionError) {
            err.style.display = 'block';
            return;
        }
        if (seatMap.length === 0) {
            err.textContent = '請至少新增一個座位分區。';
            err.style.display = 'block';
            return;
        }

        const id = appData.venues.length ? Math.max(...appData.venues.map(v => v.id)) + 1 : 1;
        appData.venues.push({ id, name, location, capacity: totalCapacity, seatMap });
        saveDataCallback();
        msg.textContent = '新增場地成功！';
        msg.style.display = 'block';
        document.getElementById('addVenueFormMgmt').reset(); // Reset form
        document.getElementById('newVenueSeatMapContainerMgmt').innerHTML = ''; // Clear dynamic rows
        addSeatSectionInputRow('newVenueSeatMapContainerMgmt'); // Add one fresh row
        renderVenueListInternal();
    });
}

function addSeatSectionInputRow(containerId, section = { id: '', name: '', capacity: '' }) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const sectionRow = document.createElement('div');
    sectionRow.className = 'seat-section-row';
    sectionRow.style.display = 'flex';
    sectionRow.style.alignItems = 'center'; // Align items vertically
    sectionRow.style.gap = '10px';
    sectionRow.style.marginBottom = '10px';
    sectionRow.style.padding = '10px';
    sectionRow.style.border = '1px dashed #ccc';
    sectionRow.style.borderRadius = '4px';

    sectionRow.innerHTML = `
        <input type="text" class="section-id" placeholder="分區ID (例:A)" value="${section.id}" required style="flex:1; padding: 8px; border: 1px solid #ccc; border-radius: 4px;">
        <input type="text" class="section-name" placeholder="分區名稱 (例:A區)" value="${section.name}" required style="flex:2; padding: 8px; border: 1px solid #ccc; border-radius: 4px;">
        <input type="number" class="section-capacity" placeholder="分區容量" value="${section.capacity}" min="1" required style="flex:1; padding: 8px; border: 1px solid #ccc; border-radius: 4px;">
        <button type="button" class="remove-section-row-btn small-btn btn-danger" style="flex-shrink:0; padding: 8px 12px;">移除</button>
    `;
    container.appendChild(sectionRow);

    sectionRow.querySelector('.remove-section-row-btn').addEventListener('click', () => {
        sectionRow.remove();
        // If it's the new venue form and no sections are left, add a default one back
        if (containerId === 'newVenueSeatMapContainerMgmt' && container.children.length === 0) {
            addSeatSectionInputRow(containerId);
        }
    });
}

function renderVenueListInternal() {
    const ul = mainContentElement.querySelector('#venueListMgmt');
    if (!ul) {
        console.error("Venue list container #venueListMgmt not found");
        return;
    }
    ul.innerHTML = '';
    appData.venues.forEach(v => {
        const li = document.createElement('li');
        li.style.borderBottom = '1px solid #eee';
        li.style.paddingBottom = '10px';
        li.style.marginBottom = '10px';

        let seatMapHtml = '<ul style="font-size:0.9em; padding-left:15px; margin-top:5px; list-style-type: disc;">';
        if (v.seatMap && v.seatMap.length > 0) {
            v.seatMap.forEach(s => {
                seatMapHtml += `<li>${s.name} (ID: ${s.id}, 容量: ${s.capacity})</li>`;
            });
        } else {
            seatMapHtml += '<li>尚未設定座位分區</li>';
        }
        seatMapHtml += '</ul>';

        li.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div style="flex-grow:1;">
              <strong>${v.name} (ID: ${v.id})</strong> <br/>
              地點: ${v.location} | 總容量: ${v.capacity}
              <div style="font-weight:bold; margin-top:5px;">座位分區:</div>
              ${seatMapHtml}
            </div>
            <div class="venue-actions" style="margin-left: 10px; flex-shrink: 0;">
              <!-- Buttons will be appended here -->
            </div>
          </div>
        `;
        
        const actionsDiv = li.querySelector('.venue-actions');

        const editBtn = document.createElement('button');
        editBtn.className = 'small-btn btn-secondary';
        editBtn.textContent = '編輯';
        editBtn.style.marginRight = '5px';
        editBtn.style.marginBottom = '5px'; // Add some space if buttons wrap
        editBtn.onclick = () => showEditVenueModal(v);
        actionsDiv.appendChild(editBtn);

        const delBtn = document.createElement('button');
        delBtn.className = 'small-btn btn-danger';
        delBtn.textContent = '刪除';
        delBtn.style.marginBottom = '5px';
        delBtn.onclick = () => {
            const concertsUsingVenue = appData.concerts && appData.concerts.some(c => c.venueId === v.id);
            if (concertsUsingVenue) {
                uiHelpers.createModal(
                    '無法刪除場地',
                    `<p>場地「${v.name}」目前有活動正在使用，無法刪除。請先移除或修改使用此場地的相關活動。</p>`,
                    [{ text: '關閉', className: 'btn-primary', onClick: () => uiHelpers.removeModal() }]
                );
                return;
            }
            // Confirmation Modal
            uiHelpers.createModal(
                '確認刪除',
                `<p>確定要刪除場地「${v.name}」嗎？此操作無法復原。</p>`,
                [
                    {
                        text: '確定刪除',
                        className: 'btn-danger',
                        onClick: () => {
                            const idx = appData.venues.findIndex(venue => venue.id === v.id);
                            if (idx !== -1) {
                                appData.venues.splice(idx, 1);
                                saveDataCallback();
                                renderVenueListInternal();
                            }
                            uiHelpers.removeModal();
                        }
                    },
                    {
                        text: '取消',
                        className: 'btn-secondary',
                        onClick: () => uiHelpers.removeModal()
                    }
                ]
            );
        };
        actionsDiv.appendChild(delBtn);
        ul.appendChild(li);
    });
}

function showEditVenueModal(venue) {
    const modalTitle = `編輯場地: ${venue.name}`;
    let seatMapEditorHtml = '<div id="editVenueSeatMapContainerModal" style="padding: 10px; border: 1px solid #eee; margin-bottom:1rem; background-color:#f9f9f9;">';
    if (venue.seatMap && venue.seatMap.length > 0) {
        venue.seatMap.forEach(s => {
            // Generate unique IDs for modal inputs to avoid conflicts if multiple modals are somehow present
            const uniqueInputIdSuffix = `${venue.id}_${s.id}`.replace(/\W/g, '_'); // Sanitize for ID
            seatMapEditorHtml += `
                <div class="seat-section-row" data-section-id-orig="${s.id}" style="display:flex; align-items:center; gap:10px; margin-bottom:10px; padding:10px; border:1px dashed #ccc; border-radius:4px;">
                    <input type="text" id="sectionIdModal_${uniqueInputIdSuffix}" class="section-id-modal" placeholder="分區ID" value="${s.id}" required style="flex:1; padding: 8px; border: 1px solid #ccc; border-radius: 4px;">
                    <input type="text" id="sectionNameModal_${uniqueInputIdSuffix}" class="section-name-modal" placeholder="分區名稱" value="${s.name}" required style="flex:2; padding: 8px; border: 1px solid #ccc; border-radius: 4px;">
                    <input type="number" id="sectionCapacityModal_${uniqueInputIdSuffix}" class="section-capacity-modal" placeholder="容量" value="${s.capacity}" min="1" required style="flex:1; padding: 8px; border: 1px solid #ccc; border-radius: 4px;">
                    <button type="button" class="remove-section-row-btn-modal small-btn btn-danger" style="flex-shrink:0; padding: 8px 12px;">移除</button>
                </div>
            `;
        });
    }
    seatMapEditorHtml += '</div>';
    seatMapEditorHtml += '<button type="button" id="addSeatSectionBtnModal" class="btn-secondary" style="margin-bottom:1rem;">新增座位分區</button>';

    const formHtml = `
        <label for="venueNameModal">場地名稱</label>
        <input type="text" id="venueNameModal" value="${venue.name}" required />
        <label for="venueLocationModal">地點</label>
        <input type="text" id="venueLocationModal" value="${venue.location}" required />
        <h5>座位分區設定</h5>
        ${seatMapEditorHtml}
        <p id="editVenueErrorModal" class="error" style="display:none; margin-top: 10px;"></p>
    `;

    const modal = uiHelpers.createModal(modalTitle, formHtml, [
        {
            text: '儲存變更',
            className: 'btn-primary',
            onClick: () => handleSaveVenueChanges(venue.id)
        },
        {
            text: '取消',
            className: 'btn-secondary',
            onClick: () => uiHelpers.removeModal()
        }
    ]);

    // Add event listeners for remove buttons in modal
    modal.box.querySelectorAll('.remove-section-row-btn-modal').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const rowToRemove = e.target.closest('.seat-section-row');
            if (rowToRemove) rowToRemove.remove();
        });
    });
    // Add event listener for add section button in modal
    modal.box.querySelector('#addSeatSectionBtnModal').addEventListener('click', () => {
        // Use a different function or ensure IDs are unique if reusing addSeatSectionInputRow
        addSeatSectionInputRowToModal('editVenueSeatMapContainerModal'); 
    });
}

function addSeatSectionInputRowToModal(containerId, section = { id: '', name: '', capacity: '' }) {
    const container = document.getElementById(containerId); 
    if (!container) {
        console.error("Modal container for seat sections not found:", containerId);
        return;
    }

    // Generate a unique suffix for new rows in the modal to avoid ID clashes if user adds multiple new rows
    const newRowSuffix = `new_${Date.now()}`;
    const sectionRow = document.createElement('div');
    sectionRow.className = 'seat-section-row';
    sectionRow.style.display = 'flex';
    sectionRow.style.alignItems = 'center';
    sectionRow.style.gap = '10px';
    sectionRow.style.marginBottom = '10px';
    sectionRow.style.padding = '10px';
    sectionRow.style.border = '1px dashed #ccc';
    sectionRow.style.borderRadius = '4px';

    sectionRow.innerHTML = `
        <input type="text" id="sectionIdModal_${newRowSuffix}" class="section-id-modal" placeholder="分區ID" value="${section.id}" required style="flex:1; padding: 8px; border: 1px solid #ccc; border-radius: 4px;">
        <input type="text" id="sectionNameModal_${newRowSuffix}" class="section-name-modal" placeholder="分區名稱" value="${section.name}" required style="flex:2; padding: 8px; border: 1px solid #ccc; border-radius: 4px;">
        <input type="number" id="sectionCapacityModal_${newRowSuffix}" class="section-capacity-modal" placeholder="容量" value="${section.capacity}" min="1" required style="flex:1; padding: 8px; border: 1px solid #ccc; border-radius: 4px;">
        <button type="button" class="remove-section-row-btn-modal small-btn btn-danger" style="flex-shrink:0; padding: 8px 12px;">移除</button>
    `;
    container.appendChild(sectionRow);

    sectionRow.querySelector('.remove-section-row-btn-modal').addEventListener('click', () => {
        sectionRow.remove();
    });
}

function handleSaveVenueChanges(venueId) {
    const nameInput = document.getElementById('venueNameModal');
    const locationInput = document.getElementById('venueLocationModal');
    const errModal = document.getElementById('editVenueErrorModal');

    if (!nameInput || !locationInput || !errModal) {
        console.error('Modal elements for venue edit not found.');
        return;
    }

    const name = nameInput.value.trim();
    const location = locationInput.value.trim();
    errModal.style.display = 'none';

    if (!name || !location) {
        errModal.textContent = '場地名稱和地點為必填欄位。';
        errModal.style.display = 'block';
        return;
    }

    const seatMap = [];
    let totalCapacity = 0;
    const sectionRows = document.querySelectorAll('#editVenueSeatMapContainerModal .seat-section-row');
    let sectionError = false;

    sectionRows.forEach(row => {
        const sectionIdInput = row.querySelector('.section-id-modal');
        const sectionNameInput = row.querySelector('.section-name-modal');
        const sectionCapacityInput = row.querySelector('.section-capacity-modal');

        if (!sectionIdInput || !sectionNameInput || !sectionCapacityInput) {
            console.error('A modal section row is missing expected input fields.');
            errModal.textContent = '座位分區表單結構錯誤(modal)，請聯絡管理員。';
            sectionError = true;
            return;
        }
        const sectionId = sectionIdInput.value.trim();
        const sectionName = sectionNameInput.value.trim();
        const sectionCapacity = parseInt(sectionCapacityInput.value);

        if (!sectionId || !sectionName || isNaN(sectionCapacity) || sectionCapacity <= 0) {
            errModal.textContent = '所有座位分區的ID、名稱為必填，容量必須是大於0的數字。';
            sectionError = true;
            return;
        }
        if (seatMap.some(s => s.id === sectionId)) {
            errModal.textContent = `座位分區ID \"${sectionId}\" 重複。請確保每個分區ID的唯一性。`;
            sectionError = true;
            return;
        }
        seatMap.push({ id: sectionId, name: sectionName, capacity: sectionCapacity });
        totalCapacity += sectionCapacity;
    });

    if (sectionError) {
        errModal.style.display = 'block';
        return;
    }
    if (seatMap.length === 0) {
        errModal.textContent = '請至少新增一個座位分區。';
        errModal.style.display = 'block';
        return;
    }

    const venueIndex = appData.venues.findIndex(v => v.id === venueId);
    if (venueIndex === -1) {
        errModal.textContent = '找不到要更新的場地。';
        errModal.style.display = 'block';
        return;
    }

    appData.venues[venueIndex] = {
        ...appData.venues[venueIndex],
        name,
        location,
        capacity: totalCapacity,
        seatMap
    };

    saveDataCallback();
    uiHelpers.removeModal();
    renderVenueListInternal();
}
