// app.js (★使用 type="time" 輸入版)

// --- 設定區 ---
const GITHUB_USER = 'mano19881013';
const GITHUB_REPO = 'Bosstime';
const GITHUB_BRANCH = 'main';
const PROFILE_PATH = './game_profile.json';
const TIMERS_DATA_URL = `https://raw.githubusercontent.com/${GITHUB_USER}/${GITHUB_REPO}/${GITHUB_BRANCH}/timers_data.json`;
const CUSTOM_EVENTS_URL = `https://raw.githubusercontent.com/${GITHUB_USER}/${GITHUB_REPO}/${GITHUB_BRANCH}/custom_events.json`;

// --- 全域變數 ---
let countdownInterval;
let hiddenBosses = [];
let showHidden = false;

// --- DOM 元素 ---
const bossContainer = document.getElementById('boss-timers-container');
const modalOverlay = document.getElementById('edit-modal-overlay');
const modal = document.getElementById('edit-modal');
const modalBossName = document.getElementById('modal-boss-name');
const editForm = document.getElementById('edit-form');
const timeInput = document.getElementById('time-input');
const cancelBtn = document.getElementById('cancel-btn');
const saveBtn = document.getElementById('save-btn');
const modalFeedback = document.getElementById('modal-feedback');
const modalMessage = document.getElementById('modal-message');
const toggleHiddenBtn = document.getElementById('toggle-hidden-btn');

// --- 初始化 ---
document.addEventListener('DOMContentLoaded', () => {
    loadSettings();
    loadAllData();
    setupEventListeners();
});

const createDateTime = (dateStr, timeStr) => {
    if (!dateStr || !timeStr || timeStr === '待確認') return null;
    return new Date(`${dateStr}T${timeStr}`);
};

function setupEventListeners() {
    editForm.addEventListener('submit', handleFormSubmit);
    cancelBtn.addEventListener('click', closeEditModal);
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) closeEditModal();
    });
    toggleHiddenBtn.addEventListener('click', toggleShowHidden);
}

function loadSettings() {
    hiddenBosses = JSON.parse(localStorage.getItem('hiddenBosses') || '[]');
    showHidden = JSON.parse(localStorage.getItem('showHidden') || 'false');
    updateToggleButton();
}
function saveHiddenBosses() {
    localStorage.setItem('hiddenBosses', JSON.stringify(hiddenBosses));
}
function saveShowHidden() {
    localStorage.setItem('showHidden', JSON.stringify(showHidden));
}

async function loadAllData() {
    bossContainer.innerHTML = '<p class="loading">正在從 GitHub 讀取資料...</p>';
    try {
        const [profileRes, timersRes, eventsRes] = await Promise.all([
            fetch(PROFILE_PATH),
            fetch(TIMERS_DATA_URL),
            fetch(CUSTOM_EVENTS_URL)
        ]);
        const profileData = await profileRes.json();
        const timersData = await timersRes.json();
        const eventsData = await eventsRes.json();
        renderCombinedList(profileData, timersData, eventsData);
    } catch (error) {
        console.error('載入資料時發生錯誤:', error);
        bossContainer.innerHTML = '<p style="color: red;">資料載入失敗，請檢查網路連線或 GitHub 設定。</p>';
    }
}

function renderCombinedList(profile, timers, events) {
    bossContainer.innerHTML = ''; 
    const now = new Date();
    let combinedList = processAndCombineData(profile, timers, events, now);
    if (!showHidden) {
        combinedList = combinedList.filter(item => !(item.itemType === 'boss' && hiddenBosses.includes(item.id)));
    }
    combinedList.forEach(item => {
        const card = createCardElement(item);
        bossContainer.appendChild(card);
    });
    startCountdownTimers();
}

function processAndCombineData(profile, timers, events, now) {
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayStrFull = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
    const todayStr = weekDays[now.getDay()];
    const allBosses = profile.timers.map(boss => {
        let bossData = {};
        if (boss.type === 'fixed') {
            bossData = { time: boss.time, date: '每日固定', isEditable: false, dateTime: createDateTime(todayStrFull, boss.time) };
        } else {
            let remoteData = timers[boss.id] || { time: '待確認', date: '' };
            const floatingDateTime = createDateTime(remoteData.date, remoteData.time);
            if (floatingDateTime && floatingDateTime < now) {
                remoteData = { time: '待確認', date: '' };
                bossData = { ...remoteData, isEditable: true, dateTime: null };
            } else {
                bossData = { ...remoteData, isEditable: true, dateTime: floatingDateTime };
            }
        }
        return { ...boss, ...bossData, itemType: 'boss' };
    });
    const allEvents = Object.values(events)
        .filter(event => !event.deleted && (event.days.includes('每日') || event.days.includes(todayStr)))
        .map(event => ({ ...event, itemType: 'event', dateTime: createDateTime(todayStrFull, event.time) }));
    const filteredList = [...allBosses, ...allEvents].filter(item => !item.dateTime || item.dateTime >= now);
    return filteredList.sort((a, b) => {
        if (!a.dateTime && b.dateTime) return 1;
        if (a.dateTime && !b.dateTime) return -1;
        if (!a.dateTime && !b.dateTime) return 0;
        return a.dateTime - b.dateTime;
    });
}

function createCardElement(item) {
    const isPending = item.time === '待確認';
    const statusClass = isPending ? 'status-pending' : 'status-confirmed';
    const card = document.createElement('div');
    card.className = 'card';
    card.dataset.id = item.id;
    let subInfoHTML = '';
    let toggleButtonHTML = '';
    if (item.itemType === 'boss') {
        subInfoHTML = `<div class="sub-info">${item.label}</div>`;
        if (item.isEditable) card.classList.add('editable');
        if (item.level >= 62) card.classList.add('high-level');
        if (hiddenBosses.includes(item.id)) {
            card.classList.add('is-hidden-item');
            toggleButtonHTML = `<button class="card-toggle-btn restore-btn" title="恢復" onclick="handleUnhideClick(event, '${item.id}')">⊕</button>`;
        } else {
            toggleButtonHTML = `<button class="card-toggle-btn hide-btn" title="隱藏" onclick="handleHideClick(event, '${item.id}')">✕</button>`;
        }
    } else {
        subInfoHTML = `<div class="sub-info">${item.days.join(', ')}</div>`;
        card.classList.add('event-card');
    }
    const displayDate = item.date && item.date !== '每日固定' ? item.date.substring(5) : '';
    let timeDisplayHTML = `<div class="time-display ${statusClass}">${item.time}</div>`;
    if (item.dateTime) {
        timeDisplayHTML += `<div class="date-display" data-countdown-to="${item.dateTime.toISOString()}">--:--:--</div>`;
    } else {
        timeDisplayHTML += `<div class="date-display">${displayDate}</div>`;
    }
    card.innerHTML = `
        ${toggleButtonHTML}
        <div class="info" ${item.isEditable ? `onclick="openEditModal('${item.id}', '${item.name}', '${item.time}')"` : ''}>
            <div class="name">${item.name}</div>
            ${subInfoHTML}
        </div>
        <div class="time-info" ${item.isEditable ? `onclick="openEditModal('${item.id}', '${item.name}', '${item.time}')"` : ''}>
            ${timeDisplayHTML}
        </div>
    `;
    return card;
}

function startCountdownTimers() {
    if (countdownInterval) clearInterval(countdownInterval);
    countdownInterval = setInterval(() => {
        const countdownElements = document.querySelectorAll('[data-countdown-to]');
        countdownElements.forEach(el => {
            const targetDate = new Date(el.dataset.countdownTo);
            const now = new Date();
            const diff = targetDate - now;
            if (diff <= 0) { el.textContent = "已出現"; return; }
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);
            el.textContent = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        });
    }, 1000);
}

function openEditModal(bossId, bossName, currentTime) {
    modal.dataset.editingId = bossId;
    modalBossName.textContent = bossName;
    timeInput.value = currentTime !== '待確認' ? currentTime : '';
    modalOverlay.classList.remove('hidden');
    timeInput.focus();
}

function closeEditModal() {
    modalOverlay.classList.add('hidden');
    modalFeedback.classList.add('hidden');
    saveBtn.disabled = false;
    timeInput.disabled = false;
}

// ★★★ 修改這裡：簡化 handleFormSubmit 函式 ★★★
async function handleFormSubmit(event) {
    event.preventDefault();
    const bossId = modal.dataset.editingId;
    const newTime = timeInput.value; // 直接從 <input type="time"> 獲取值

    if (!newTime) { // 簡單檢查是否為空
        showModalMessage('請選擇一個時間', 'error');
        return;
    }

    saveBtn.disabled = true;
    timeInput.disabled = true;
    modalFeedback.classList.remove('hidden');
    showModalMessage('更新中...', '');

    const cardToUpdate = document.querySelector(`.card[data-id="${bossId}"]`);
    const originalTimeDisplay = cardToUpdate.querySelector('.time-display');
    const originalCountdown = cardToUpdate.querySelector('.date-display');
    const originalTime = originalTimeDisplay.textContent;
    originalTimeDisplay.textContent = newTime;
    originalCountdown.textContent = '計算中...';

    try {
        const response = await fetch('/.netlify/functions/update-timer', {
            method: 'POST',
            body: JSON.stringify({ bossId, time: newTime }),
            headers: { 'Content-Type': 'application/json' }
        });
        if (!response.ok) throw new Error(`伺服器錯誤: ${response.statusText}`);
        showModalMessage('更新成功！', 'success');
        setTimeout(() => { closeEditModal(); loadAllData(); }, 1000);
    } catch (error) {
        console.error('更新失敗:', error);
        showModalMessage(`更新失敗: ${error.message}`, 'error');
        originalTimeDisplay.textContent = originalTime;
        originalCountdown.textContent = '';
        setTimeout(closeEditModal, 2000);
    }
}

function showModalMessage(message, type) {
    modalMessage.textContent = message;
    modalMessage.className = type;
}

function handleHideClick(event, bossId) {
    event.stopPropagation();
    if (!hiddenBosses.includes(bossId)) {
        hiddenBosses.push(bossId);
        saveHiddenBosses();
        document.querySelector(`.card[data-id="${bossId}"]`).style.display = 'none';
    }
}

function handleUnhideClick(event, bossId) {
    event.stopPropagation();
    hiddenBosses = hiddenBosses.filter(id => id !== bossId);
    saveHiddenBosses();
    loadAllData();
}

function toggleShowHidden() {
    showHidden = !showHidden;
    saveShowHidden();
    updateToggleButton();
    loadAllData();
}

function updateToggleButton() {
    toggleHiddenBtn.textContent = showHidden ? '隱藏已隱藏的 BOSS' : '顯示已隱藏的 BOSS';
}

// ★★★ 我們不再需要 parseAndValidateTime 這個函式了！★★★
// 可以將它整個刪除，讓程式碼更乾淨。