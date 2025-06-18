// UI utility functions
let currentModalOverlay = null; // Added to track the current modal

export function roleNameDisplay(role) {
  switch(role){
    case 'admin': return '管理者';
    case 'organizer': return '主辦方';
    case 'spectator': return '一般使用者'; // Updated from '觀眾'
    case 'staff': return '工作人員';
    default: return role;
  }
}

export function createModal(title, contentHtml, buttonsConfig = []) {
  // Remove any existing modal first
  if (currentModalOverlay) {
    removeModal();
  }

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  const box = document.createElement('div');
  box.className = 'modal-box';

  // Add title
  if (title) {
    const titleElement = document.createElement('h3');
    titleElement.textContent = title;
    box.appendChild(titleElement);
  }

  // Add content
  const contentElement = document.createElement('div');
  contentElement.className = 'modal-content'; // Added a class for potential styling
  contentElement.innerHTML = contentHtml;
  box.appendChild(contentElement);

  // Add buttons
  if (buttonsConfig.length > 0) {
    const buttonsContainer = document.createElement('div');
    buttonsContainer.className = 'modal-buttons'; // Added a class for potential styling
    buttonsConfig.forEach(btnConfig => {
      const button = document.createElement('button');
      button.textContent = btnConfig.text;
      if (btnConfig.className) {
        button.className = btnConfig.className;
      }
      if (btnConfig.id) { // Allow setting an ID for buttons if needed
        button.id = btnConfig.id;
      }
      button.addEventListener('click', btnConfig.onClick);
      buttonsContainer.appendChild(button);
    });
    box.appendChild(buttonsContainer);
  }

  overlay.appendChild(box);
  document.body.appendChild(overlay);
  currentModalOverlay = overlay; // Store reference to the new modal

  // The elements like 'modalSessionDateTime' are now part of contentHtml,
  // so they will be in the DOM when this function returns.
  return { overlay, box }; // Return references
}

export function removeModal() {
  if (currentModalOverlay && currentModalOverlay.parentElement) {
    currentModalOverlay.parentElement.removeChild(currentModalOverlay);
    currentModalOverlay = null;
  }
}

export function populateVenueOptions(selectElement, venuesArray) {
  if (!selectElement) return;
  selectElement.innerHTML = ''; // Clear previous options before repopulating
  const placeholder = document.createElement('option');
  placeholder.value = "";
  placeholder.textContent = "請選擇場地";
  placeholder.disabled = true;
  placeholder.selected = true;
  selectElement.appendChild(placeholder);

  venuesArray.forEach(v => {
    const option = document.createElement('option');
    option.value = v.id;
    option.textContent = `${v.name} (${v.location}) 容量:${v.capacity}`;
    selectElement.appendChild(option);
  });
}
