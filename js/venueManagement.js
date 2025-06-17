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
            const seatingTypeSelect = row.querySelector('.section-seating-type');
            const rowsInput = row.querySelector('.section-rows');
            const seatsPerRowInput = row.querySelector('.section-seats-per-row');

            if (!sectionIdInput || !sectionNameInput || !sectionCapacityInput || !seatingTypeSelect) { // Added seatingTypeSelect check
                console.error('A section row is missing expected input fields.');
                err.textContent = '座位分區表單結構錯誤，請聯絡管理員。';
                sectionError = true;
                return;
            }

            const sectionId = sectionIdInput.value.trim();
            const sectionName = sectionNameInput.value.trim();
            const sectionCapacity = parseInt(sectionCapacityInput.value);
            const seatingType = seatingTypeSelect.value;
            const sectionRowsVal = seatingType === 'numbered' ? parseInt(rowsInput.value) : null;
            const sectionSeatsPerRowVal = seatingType === 'numbered' ? parseInt(seatsPerRowInput.value) : null;

            if (!sectionId || !sectionName || isNaN(sectionCapacity) || sectionCapacity <= 0) {
                err.textContent = '所有座位分區的ID、名稱為必填，容量必須是大於0的數字。';
                sectionError = true;
                return;
            }
            if (seatingType === 'numbered') {
                if (!rowsInput || !seatsPerRowInput) { // Check if numbered seating specific inputs exist
                     console.error('Numbered seating section row is missing rows/seatsPerRow input fields.');
                     err.textContent = '對號入座分區表單結構錯誤，請聯絡管理員。';
                     sectionError = true;
                     return;
                }
                if (isNaN(sectionRowsVal) || sectionRowsVal <= 0 || isNaN(sectionSeatsPerRowVal) || sectionSeatsPerRowVal <= 0) {
                    err.textContent = '對號入座分區的行數和每行座位數必須是大於0的數字。';
                    sectionError = true;
                    return;
                }
                if (sectionRowsVal * sectionSeatsPerRowVal !== sectionCapacity) {
                    err.textContent = `分區 \"${sectionName}\" 的容量 (${sectionCapacity}) 與行數(${sectionRowsVal})*每行座位數(${sectionSeatsPerRowVal}) (${sectionRowsVal * sectionSeatsPerRowVal}) 不符。請修正。`;
                    sectionError = true;
                    return;
                }
            }

            // 強制型態選項只允許 'generalAdmission' 或 'numbered'
            if (seatingType !== 'generalAdmission' && seatingType !== 'numbered') {
                err.textContent = '座位分區型態必須為「自由入座」或「對號入座」，請重新選擇。';
                sectionError = true;
                return;
            }

            if (seatMap.some(s => s.id === sectionId)) {
                err.textContent = `座位分區ID \"${sectionId}\" 重複。請確保每個分區ID的唯一性。`;
                sectionError = true;
                return;
            }
            const sectionData = { 
                id: sectionId, 
                name: sectionName, 
                capacity: sectionCapacity, 
                seatingType: seatingType 
            };
            if (seatingType === 'numbered') {
                sectionData.rows = sectionRowsVal;
                sectionData.seatsPerRow = sectionSeatsPerRowVal;
            }
            seatMap.push(sectionData);
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

function addSeatSectionInputRow(containerId, section = { id: '', name: '', capacity: '', seatingType: 'generalAdmission', rows: '', seatsPerRow: '' }) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const sectionRow = document.createElement('div');
    sectionRow.className = 'seat-section-row';
    sectionRow.style.display = 'flex';
    sectionRow.style.flexWrap = 'wrap'; // Allow wrapping for smaller screens
    sectionRow.style.alignItems = 'flex-start'; // Align items to the top
    sectionRow.style.gap = '10px';
    sectionRow.style.marginBottom = '10px';
    sectionRow.style.padding = '10px';
    sectionRow.style.border = '1px dashed #ccc';
    sectionRow.style.borderRadius = '4px';

    // Create unique IDs for elements within this row to avoid conflicts
    const uniqueSuffix = Date.now() + '_' + Math.random().toString(36).substring(2, 7);

    sectionRow.innerHTML = `
        <div style="flex: 1 1 100%; margin-bottom: 5px;">
            <label for="sectionId_${uniqueSuffix}" style="display:block; font-size:0.9em; margin-bottom:2px;">分區ID</label>
            <input type="text" id="sectionId_${uniqueSuffix}" class="section-id" placeholder="分區ID (例:A)" value="${section.id}" required style="width:100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box;">
        </div>
        <div style="flex: 2 1 100%; margin-bottom: 5px;">
            <label for="sectionName_${uniqueSuffix}" style="display:block; font-size:0.9em; margin-bottom:2px;">分區名稱</label>
            <input type="text" id="sectionName_${uniqueSuffix}" class="section-name" placeholder="分區名稱 (例:A區)" value="${section.name}" required style="width:100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box;">
        </div>
        <div style="flex: 1 1 100%; margin-bottom: 5px;">
            <label for="seatingType_${uniqueSuffix}" style="display:block; font-size:0.9em; margin-bottom:2px;">座位類型</label>
            <select id="seatingType_${uniqueSuffix}" class="section-seating-type" style="width:100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box;">
                <option value="generalAdmission" ${section.seatingType === 'generalAdmission' ? 'selected' : ''}>自由入座</option>
                <option value="numbered" ${section.seatingType === 'numbered' ? 'selected' : ''}>對號入座</option>
            </select>
        </div>
        <div id="numberedSeatingFields_${uniqueSuffix}" style="flex: 1 1 100%; display: ${(section.seatingType === 'numbered') ? 'flex' : 'none'}; gap: 10px; flex-wrap: wrap;">
            <div style="flex: 1 1 calc(50% - 5px); margin-bottom: 5px;">
                <label for="sectionRows_${uniqueSuffix}" style="display:block; font-size:0.9em; margin-bottom:2px;">行數</label>
                <input type="number" id="sectionRows_${uniqueSuffix}" class="section-rows" placeholder="行數" value="${section.rows || ''}" min="1" style="width:100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box;">
            </div>
            <div style="flex: 1 1 calc(50% - 5px); margin-bottom: 5px;">
                <label for="sectionSeatsPerRow_${uniqueSuffix}" style="display:block; font-size:0.9em; margin-bottom:2px;">每行座位數</label>
                <input type="number" id="sectionSeatsPerRow_${uniqueSuffix}" class="section-seats-per-row" placeholder="每行座位數" value="${section.seatsPerRow || ''}" min="1" style="width:100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box;">
            </div>
        </div>
        <div style="flex: 1 1 100%; margin-bottom: 5px;">
            <label for="sectionCapacity_${uniqueSuffix}" style="display:block; font-size:0.9em; margin-bottom:2px;">分區容量</label>
            <input type="number" id="sectionCapacity_${uniqueSuffix}" class="section-capacity" placeholder="分區容量" value="${section.capacity}" min="1" required style="width:100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box;" ${section.seatingType === 'numbered' ? 'readonly' : ''}>
        </div>
        <div style="flex: 0 0 auto; align-self: flex-end; margin-bottom: 5px;"> <!-- Ensure button aligns with bottom of other inputs if they wrap -->
             <button type="button" class="remove-section-row-btn small-btn btn-danger" style="padding: 8px 12px;">移除</button>
        </div>
    `;
    container.appendChild(sectionRow);

    const seatingTypeSelect = sectionRow.querySelector(`.section-seating-type`);
    const numberedFieldsDiv = sectionRow.querySelector(`#numberedSeatingFields_${uniqueSuffix}`);
    const rowsInput = sectionRow.querySelector(`.section-rows`);
    const seatsPerRowInput = sectionRow.querySelector(`.section-seats-per-row`);
    const capacityInput = sectionRow.querySelector(`.section-capacity`);

    function updateCapacityAndFields() {
        if (seatingTypeSelect.value === 'numbered') {
            numberedFieldsDiv.style.display = 'flex';
            rowsInput.required = true;
            seatsPerRowInput.required = true;
            capacityInput.readOnly = true;
            const rows = parseInt(rowsInput.value) || 0;
            const seatsPerRow = parseInt(seatsPerRowInput.value) || 0;
            capacityInput.value = rows * seatsPerRow;
        } else { // generalAdmission
            numberedFieldsDiv.style.display = 'none';
            rowsInput.required = false;
            seatsPerRowInput.required = false;
            rowsInput.value = '';
            seatsPerRowInput.value = '';
            capacityInput.readOnly = false;
        }
    }
    seatingTypeSelect.addEventListener('change', updateCapacityAndFields);
    rowsInput.addEventListener('input', updateCapacityAndFields);
    seatsPerRowInput.addEventListener('input', updateCapacityAndFields);

    // Initial call to set state based on pre-filled section data (e.g. when editing)
    updateCapacityAndFields();


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
                let details = `容量: ${s.capacity}`;
                if (s.seatingType === 'numbered') {
                    details += `, 對號入座 (${s.rows}行 x ${s.seatsPerRow}座/行)`
                } else {
                    details += `, 自由入座`;
                }
                seatMapHtml += `<li>${s.name} (ID: ${s.id}, ${details})</li>`;
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
        venue.seatMap.forEach((s, index) => { // Added index for unique IDs
            const uniqueInputIdSuffix = `edit_${venue.id}_${s.id}_${index}`.replace(/\W/g, '_'); // Ensure more unique IDs
            const isNumbered = s.seatingType === 'numbered';
            seatMapEditorHtml += `
                <div class="seat-section-row" data-section-id-orig="${s.id}" style="display:flex; flex-wrap:wrap; align-items:flex-start; gap:10px; margin-bottom:10px; padding:10px; border:1px dashed #ccc; border-radius:4px;">
                    <div style="flex: 1 1 100%; margin-bottom: 5px;">
                        <label for="sectionIdModal_${uniqueInputIdSuffix}" style="display:block; font-size:0.9em; margin-bottom:2px;">分區ID</label>
                        <input type="text" id="sectionIdModal_${uniqueInputIdSuffix}" class="section-id-modal" placeholder="分區ID" value="${s.id}" required style="width:100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box;">
                    </div>
                    <div style="flex: 2 1 100%; margin-bottom: 5px;">
                        <label for="sectionNameModal_${uniqueInputIdSuffix}" style="display:block; font-size:0.9em; margin-bottom:2px;">分區名稱</label>
                        <input type="text" id="sectionNameModal_${uniqueInputIdSuffix}" class="section-name-modal" placeholder="分區名稱" value="${s.name}" required style="width:100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box;">
                    </div>
                    <div style="flex: 1 1 100%; margin-bottom: 5px;">
                        <label for="seatingTypeModal_${uniqueInputIdSuffix}" style="display:block; font-size:0.9em; margin-bottom:2px;">座位類型</label>
                        <select id="seatingTypeModal_${uniqueInputIdSuffix}" class="section-seating-type-modal" style="width:100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box;">
                            <option value="generalAdmission" ${s.seatingType === 'generalAdmission' ? 'selected' : ''}>自由入座</option>
                            <option value="numbered" ${s.seatingType === 'numbered' ? 'selected' : ''}>對號入座</option>
                        </select>
                    </div>
                    <div id="numberedSeatingFieldsModal_${uniqueInputIdSuffix}" class="numbered-seating-fields-modal" style="flex: 1 1 100%; display: ${(isNumbered) ? 'flex' : 'none'}; gap: 10px; flex-wrap: wrap;">
                        <div style="flex: 1 1 calc(50% - 5px); margin-bottom: 5px;">
                            <label for="sectionRowsModal_${uniqueInputIdSuffix}" style="display:block; font-size:0.9em; margin-bottom:2px;">行數</label>
                            <input type="number" id="sectionRowsModal_${uniqueInputIdSuffix}" class="section-rows-modal" placeholder="行數" value="${s.rows || ''}" min="1" style="width:100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box;">
                        </div>
                        <div style="flex: 1 1 calc(50% - 5px); margin-bottom: 5px;">
                            <label for="sectionSeatsPerRowModal_${uniqueInputIdSuffix}" style="display:block; font-size:0.9em; margin-bottom:2px;">每行座位數</label>
                            <input type="number" id="sectionSeatsPerRowModal_${uniqueInputIdSuffix}" class="section-seats-per-row-modal" placeholder="每行座位數" value="${s.seatsPerRow || ''}" min="1" style="width:100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box;">
                        </div>
                    </div>
                    <div style="flex: 1 1 100%; margin-bottom: 5px;">
                        <label for="sectionCapacityModal_${uniqueInputIdSuffix}" style="display:block; font-size:0.9em; margin-bottom:2px;">分區容量</label>
                        <input type="number" id="sectionCapacityModal_${uniqueInputIdSuffix}" class="section-capacity-modal" placeholder="容量" value="${s.capacity}" min="1" required style="width:100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box;" ${isNumbered ? 'readonly' : ''}>
                    </div>
                    <div style="flex: 0 0 auto; align-self: flex-end; margin-bottom: 5px;">
                        <button type="button" class="remove-section-row-btn-modal small-btn btn-danger" style="padding: 8px 12px;">移除</button>
                    </div>
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

    // Add event listeners for dynamic fields within each existing section row in the modal
    modal.box.querySelectorAll('#editVenueSeatMapContainerModal .seat-section-row').forEach(sectionRowElement => {
        const seatingTypeSelect = sectionRowElement.querySelector('.section-seating-type-modal');
        const numberedFieldsDiv = sectionRowElement.querySelector('.numbered-seating-fields-modal'); // Direct child selector might be needed if IDs are not unique enough
        const rowsInput = sectionRowElement.querySelector('.section-rows-modal');
        const seatsPerRowInput = sectionRowElement.querySelector('.section-seats-per-row-modal');
        const capacityInput = sectionRowElement.querySelector('.section-capacity-modal');
        
        if (seatingTypeSelect && numberedFieldsDiv && rowsInput && seatsPerRowInput && capacityInput) {
            function updateModalCapacityAndFields() {
                if (seatingTypeSelect.value === 'numbered') {
                    numberedFieldsDiv.style.display = 'flex';
                    capacityInput.readOnly = true;
                    const rows = parseInt(rowsInput.value) || 0;
                    const seatsPerRow = parseInt(seatsPerRowInput.value) || 0;
                    capacityInput.value = rows * seatsPerRow;
                } else { // generalAdmission
                    numberedFieldsDiv.style.display = 'none';
                    capacityInput.readOnly = false;
                }
            }
            seatingTypeSelect.addEventListener('change', updateModalCapacityAndFields);
            rowsInput.addEventListener('input', updateModalCapacityAndFields);
            seatsPerRowInput.addEventListener('input', updateModalCapacityAndFields);
            // Initial call to set state for existing rows
            updateModalCapacityAndFields(); 
        }
    });

    // Add event listener for add section button in modal
    modal.box.querySelector('#addSeatSectionBtnModal').addEventListener('click', () => {
        // Use a different function or ensure IDs are unique if reusing addSeatSectionInputRow
        addSeatSectionInputRowToModal('editVenueSeatMapContainerModal'); 
    });
}

function addSeatSectionInputRowToModal(containerId, section = { id: '', name: '', capacity: '', seatingType: 'generalAdmission', rows: '', seatsPerRow: '' }) {
    const container = document.getElementById(containerId); 
    if (!container) {
        console.error("Modal container for seat sections not found:", containerId);
        return;
    }

    const uniqueSuffix = `modal_new_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const sectionRow = document.createElement('div');
    sectionRow.className = 'seat-section-row';
    sectionRow.style.display = 'flex';
    sectionRow.style.flexWrap = 'wrap';
    sectionRow.style.alignItems = 'flex-start';
    sectionRow.style.gap = '10px';
    sectionRow.style.marginBottom = '10px';
    sectionRow.style.padding = '10px';
    sectionRow.style.border = '1px dashed #ccc';
    sectionRow.style.borderRadius = '4px';

    sectionRow.innerHTML = `
        <div style="flex: 1 1 100%; margin-bottom: 5px;">
            <label for="sectionIdModal_${uniqueSuffix}" style="display:block; font-size:0.9em; margin-bottom:2px;">分區ID</label>
            <input type="text" id="sectionIdModal_${uniqueSuffix}" class="section-id-modal" placeholder="分區ID" value="${section.id}" required style="width:100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box;">
        </div>
        <div style="flex: 2 1 100%; margin-bottom: 5px;">
            <label for="sectionNameModal_${uniqueSuffix}" style="display:block; font-size:0.9em; margin-bottom:2px;">分區名稱</label>
            <input type="text" id="sectionNameModal_${uniqueSuffix}" class="section-name-modal" placeholder="分區名稱" value="${section.name}" required style="width:100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box;">
        </div>
        <div style="flex: 1 1 100%; margin-bottom: 5px;">
            <label for="seatingTypeModal_${uniqueSuffix}" style="display:block; font-size:0.9em; margin-bottom:2px;">座位類型</label>
            <select id="seatingTypeModal_${uniqueSuffix}" class="section-seating-type-modal" style="width:100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box;">
                <option value="generalAdmission" ${section.seatingType === 'generalAdmission' ? 'selected' : ''}>自由入座</option>
                <option value="numbered" ${section.seatingType === 'numbered' ? 'selected' : ''}>對號入座</option>
            </select>
        </div>
        <div id="numberedSeatingFieldsModal_${uniqueSuffix}" style="flex: 1 1 100%; display: ${(section.seatingType === 'numbered') ? 'flex' : 'none'}; gap: 10px; flex-wrap: wrap;">
            <div style="flex: 1 1 calc(50% - 5px); margin-bottom: 5px;">
                <label for="sectionRowsModal_${uniqueSuffix}" style="display:block; font-size:0.9em; margin-bottom:2px;">行數</label>
                <input type="number" id="sectionRowsModal_${uniqueSuffix}" class="section-rows-modal" placeholder="行數" value="${section.rows || ''}" min="1" style="width:100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box;">
            </div>
            <div style="flex: 1 1 calc(50% - 5px); margin-bottom: 5px;">
                <label for="sectionSeatsPerRowModal_${uniqueSuffix}" style="display:block; font-size:0.9em; margin-bottom:2px;">每行座位數</label>
                <input type="number" id="sectionSeatsPerRowModal_${uniqueSuffix}" class="section-seats-per-row-modal" placeholder="每行座位數" value="${section.seatsPerRow || ''}" min="1" style="width:100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box;">
            </div>
        </div>
        <div style="flex: 1 1 100%; margin-bottom: 5px;">
            <label for="sectionCapacityModal_${uniqueSuffix}" style="display:block; font-size:0.9em; margin-bottom:2px;">分區容量</label>
            <input type="number" id="sectionCapacityModal_${uniqueSuffix}" class="section-capacity-modal" placeholder="容量" value="${section.capacity}" min="1" required style="width:100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box;" ${section.seatingType === 'numbered' ? 'readonly' : ''}>
        </div>
        <div style="flex: 0 0 auto; align-self: flex-end; margin-bottom: 5px;">
            <button type="button" class="remove-section-row-btn-modal small-btn btn-danger" style="padding: 8px 12px;">移除</button>
        </div>
    `;
    container.appendChild(sectionRow);

    const seatingTypeSelect = sectionRow.querySelector(`.section-seating-type-modal`);
    const numberedFieldsDiv = sectionRow.querySelector(`#numberedSeatingFieldsModal_${uniqueSuffix}`);
    const rowsInput = sectionRow.querySelector(`.section-rows-modal`);
    const seatsPerRowInput = sectionRow.querySelector(`.section-seats-per-row-modal`);
    const capacityInput = sectionRow.querySelector(`.section-capacity-modal`);

    function updateCapacityAndFieldsModal() {
        if (seatingTypeSelect.value === 'numbered') {
            numberedFieldsDiv.style.display = 'flex';
            capacityInput.readOnly = true;
            const rows = parseInt(rowsInput.value) || 0;
            const seatsPerRow = parseInt(seatsPerRowInput.value) || 0;
            capacityInput.value = rows * seatsPerRow;
        } else { // generalAdmission
            numberedFieldsDiv.style.display = 'none';
            capacityInput.readOnly = false;
        }
    }
    seatingTypeSelect.addEventListener('change', updateCapacityAndFieldsModal);
    rowsInput.addEventListener('input', updateCapacityAndFieldsModal);
    seatsPerRowInput.addEventListener('input', updateCapacityAndFieldsModal);
    updateCapacityAndFieldsModal(); // Initial call

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
        const seatingTypeSelect = row.querySelector('.section-seating-type-modal'); // Added for modal
        const rowsInput = row.querySelector('.section-rows-modal'); // Added for modal
        const seatsPerRowInput = row.querySelector('.section-seats-per-row-modal'); // Added for modal

        if (!sectionIdInput || !sectionNameInput || !sectionCapacityInput || !seatingTypeSelect) { // Added seatingTypeSelect check
            console.error('A modal section row is missing expected input fields.');
            errModal.textContent = '座位分區表單結構錯誤(modal)，請聯絡管理員。';
            sectionError = true;
            return;
        }
        const sectionId = sectionIdInput.value.trim();
        const sectionName = sectionNameInput.value.trim();
        const sectionCapacity = parseInt(sectionCapacityInput.value);
        const seatingType = seatingTypeSelect.value;
        const sectionRowsVal = seatingType === 'numbered' ? parseInt(rowsInput.value) : null;
        const sectionSeatsPerRowVal = seatingType === 'numbered' ? parseInt(seatsPerRowInput.value) : null;

        if (!sectionId || !sectionName || isNaN(sectionCapacity) || sectionCapacity <= 0) {
            errModal.textContent = '所有座位分區的ID、名稱為必填，容量必須是大於0的數字。';
            sectionError = true;
            return;
        }

        if (seatingType === 'numbered') {
            if (!rowsInput || !seatsPerRowInput) { // Check if numbered seating specific inputs exist
                 console.error('Numbered seating section row in modal is missing rows/seatsPerRow input fields.');
                 errModal.textContent = '對號入座分區表單結構錯誤(modal)，請聯絡管理員。';
                 sectionError = true;
                 return;
            }
            if (isNaN(sectionRowsVal) || sectionRowsVal <= 0 || isNaN(sectionSeatsPerRowVal) || sectionSeatsPerRowVal <= 0) {
                errModal.textContent = '對號入座分區的行數和每行座位數必須是大於0的數字。';
                sectionError = true;
                return;
            }
            if (sectionRowsVal * sectionSeatsPerRowVal !== sectionCapacity) {
                errModal.textContent = `分區 \"${sectionName}\" 的容量 (${sectionCapacity}) 與行數(${sectionRowsVal})*每行座位數(${sectionSeatsPerRowVal}) (${sectionRowsVal * sectionSeatsPerRowVal}) 不符。請修正。`;
                sectionError = true;
                return;
            }
        }

        // 強制型態選項只允許 'generalAdmission' 或 'numbered'
        if (seatingType !== 'generalAdmission' && seatingType !== 'numbered') {
            errModal.textContent = '座位分區型態必須為「自由入座」或「對號入座」，請重新選擇。';
            sectionError = true;
            return;
        }

        if (seatMap.some(s => s.id === sectionId)) {
            errModal.textContent = `座位分區ID \"${sectionId}\" 重複。請確保每個分區ID的唯一性。`;
            sectionError = true;
            return;
        }
        
        const sectionData = {
            id: sectionId, 
            name: sectionName, 
            capacity: sectionCapacity,
            seatingType: seatingType
        };
        if (seatingType === 'numbered') {
            sectionData.rows = sectionRowsVal;
            sectionData.seatsPerRow = sectionSeatsPerRowVal;
        }
        seatMap.push(sectionData);
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
