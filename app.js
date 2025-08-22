// app.js (整合所有功能的最終版本)

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
let allEventsData = {}; // ★ 新增：用來在前端暫存所有事件資料，方便管理

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
// ★ 新增：事件管理相關 DOM 元素
const manageEventsBtn = document.getElementById('manage-events-btn');
const eventManagerOverlay = document.getElementById('event-manager-overlay');
const eventForm = document.getElementById('event-form');
const eventIdInput = document.getElementById('event-id-input');
const eventNameInput = document.getElementById('event-name-input');
const eventTimeInput = document.getElementById('event-time-input');
const eventDaysCheckboxes = document.getElementById('event-days-checkboxes');
const eventNotifyInput = document.getElementById('event-notify-input');
const eventCancelBtn = document.getElementById('event-cancel-btn');
const closeEventManagerBtn = document.getElementById('close-event-manager-btn');
const eventListContainer = document.getElementById('event-list-container');


// --- 初始化 ---
document.addEventListener('DOMContentLoaded', () => {
    loadSettings();
    loadAllData();
    setupEventListeners();
    createDayCheckboxes(); // 建立星期 checkbox
});

const createDateTime = (dateStr, timeStr) => {
    if (!dateStr || !timeStr || timeStr === '待確認') return null;
    return new Date(`${dateStr}T${timeStr}`);
};

function setupEventListeners() {
    // BOSS 編輯視窗
    editForm.addEventListener('submit', handleFormSubmit);
    cancelBtn.addEventListener('click', closeEditModal);
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) closeEditModal();
    });
    // 主要控制按鈕
    toggleHiddenBtn.addEventListener('click', toggleShowHidden);
    manageEventsBtn.addEventListener('click', openEventManager);
    // 事件管理視窗
    closeEventManagerBtn.addEventListener('click', closeEventManager);
    eventManagerOverlay.addEventListener('click', (e) => {
        if (e.target === eventManagerOverlay) closeEventManager();
    });
    eventForm.addEventListener('submit', handleEventFormSubmit);
    eventCancelBtn.addEventListener('click', resetEventForm);
}

// --- LocalStorage ---
function loadSettings() { hiddenBosses = JSON.parse(localStorage.getItem('hiddenBosses') || '[]'); showHidden = JSON.parse(localStorage.getItem('showHidden') || 'false'); updateToggleButton(); }
function saveHiddenBosses() { localStorage.setItem('hiddenBosses', JSON.stringify(hiddenBosses)); }
function saveShowHidden() { localStorage.setItem('showHidden', JSON.stringify(showHidden)); }

// --- 主資料流程 ---
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
        
        allEventsData = eventsData; // ★ 暫存所有事件資料
        
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

// --- 倒數計時器 ---
function startCountdownTimers() { if (countdownInterval) clearInterval(countdownInterval); countdownInterval = setInterval(() => { const countdownElements = document.querySelectorAll('[data-countdown-to]'); countdownElements.forEach(el => { const targetDate = new Date(el.dataset.countdownTo); const now = new Date(); const diff = targetDate - now; if (diff <= 0) { el.textContent = "已出現"; return; } const hours = Math.floor(diff / 3600000); const minutes = Math.floor((diff % 3600000) / 60000); const seconds = Math.floor((diff % 60000) / 1000); el.textContent = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`; }); }, 1000); }

// --- BOSS 編輯 Modal ---
function openEditModal(bossId, bossName, currentTime) { modal.dataset.editingId = bossId; modalBossName.textContent = bossName; timeInput.value = currentTime !== '待確認' ? currentTime : ''; modalOverlay.classList.remove('hidden'); timeInput.focus(); }
function closeEditModal() { modalOverlay.classList.add('hidden'); modalFeedback.classList.add('hidden'); saveBtn.disabled = false; timeInput.disabled = false; }
async function handleFormSubmit(event) {
    event.preventDefault();
    const bossId = modal.dataset.editingId;
    const newTime = timeInput.value;
    if (!newTime) { showModalMessage('請選擇一個時間', 'error'); return; }
    saveBtn.disabled = true; timeInput.disabled = true; modalFeedback.classList.remove('hidden'); showModalMessage('更新中...', '');
    const cardToUpdate = document.querySelector(`.card[data-id="${bossId}"]`);
    const originalTimeDisplay = cardToUpdate.querySelector('.time-display');
    const originalCountdown = cardToUpdate.querySelector('.date-display');
    const originalTime = originalTimeDisplay.textContent;
    originalTimeDisplay.textContent = newTime;
    originalCountdown.textContent = '更新成功';
    try {
        const response = await fetch('/.netlify/functions/update-timer', { method: 'POST', body: JSON.stringify({ bossId, time: newTime }), headers: { 'Content-Type': 'application/json' } });
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
function showModalMessage(message, type) { modalMessage.textContent = message; modalMessage.className = type; }

// --- 個人化設定 ---
function handleHideClick(event, bossId) { event.stopPropagation(); if (!hiddenBosses.includes(bossId)) { hiddenBosses.push(bossId); saveHiddenBosses(); document.querySelector(`.card[data-id="${bossId}"]`).style.display = 'none'; } }
function handleUnhideClick(event, bossId) { event.stopPropagation(); hiddenBosses = hiddenBosses.filter(id => id !== bossId); saveHiddenBosses(); loadAllData(); }
function toggleShowHidden() { showHidden = !showHidden; saveShowHidden(); updateToggleButton(); loadAllData(); }
function updateToggleButton() { toggleHiddenBtn.textContent = showHidden ? '隱藏已隱藏的 BOSS' : '顯示已隱藏的 BOSS'; }


// ★★★ 全新的事件管理功能 ★★★
function openEventManager() {
    renderEventManagerList();
    resetEventForm();
    eventManagerOverlay.classList.remove('hidden');
}

function closeEventManager() {
    eventManagerOverlay.classList.add('hidden');
}

function renderEventManagerList() {
    eventListContainer.innerHTML = '';
    // 按照修改時間排序，最新的在最上面
    const sortedEvents = Object.values(allEventsData).sort((a, b) => new Date(b.modified) - new Date(a.modified));
    
    sortedEvents.forEach(event => {
        const item = document.createElement('div');
        item.className = 'event-list-item';
        if (event.deleted) item.classList.add('deleted');
        item.innerHTML = `
            <div class="event-item-info">
                <strong>${event.name}</strong> (${event.time}) - [${event.days.join(', ')}]
            </div>
            <div class="event-item-actions">
                <button onclick="fillEventForm('${event.id}')">編輯</button>
                <button onclick="toggleEventDeleted('${event.id}', ${!event.deleted})">
                    ${event.deleted ? '恢復' : '刪除'}
                </button>
            </div>
        `;
        eventListContainer.appendChild(item);
    });
}

function fillEventForm(eventId) {
    const event = allEventsData[eventId];
    eventIdInput.value = event.id;
    eventNameInput.value = event.name;
    eventTimeInput.value = event.time;
    eventNotifyInput.value = event.notify_minutes;
    const checkboxes = document.querySelectorAll('#event-days-checkboxes input');
    checkboxes.forEach(cb => {
        cb.checked = event.days.includes(cb.value);
    });
}

function resetEventForm() {
    eventForm.reset();
    eventIdInput.value = '';
    const checkboxes = document.querySelectorAll('#event-days-checkboxes input');
    checkboxes.forEach(cb => cb.checked = false);
}

async function handleEventFormSubmit(event) {
    event.preventDefault();
    const eventId = eventIdInput.value;
    const selectedDays = [...document.querySelectorAll('#event-days-checkboxes input:checked')].map(cb => cb.value);

    if (selectedDays.length === 0) {
        alert('請至少選擇一個重複日！');
        return;
    }

    const eventData = {
        name: eventNameInput.value,
        time: eventTimeInput.value,
        days: selectedDays,
        notify_minutes: parseInt(eventNotifyInput.value) || 0,
    };

    let endpoint = '';
    let body = {};
    let isUpdating = !!eventId;

    if (isUpdating) {
        endpoint = '/.netlify/functions/update-event';
        body = { eventId: eventId, updatedData: eventData };
    } else {
        endpoint = '/.netlify/functions/create-event';
        body = eventData;
    }

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            body: JSON.stringify(body)
        });
        if (!response.ok) throw new Error('伺服器錯誤');
        alert('事件儲存成功！');
        resetEventForm();
        await loadAllData();
        renderEventManagerList(); // 重新渲染管理列表以顯示最新狀態
    } catch (error) {
        alert('事件儲存失敗！');
        console.error(error);
    }
}

async function toggleEventDeleted(eventId, shouldDelete) {
    try {
        const response = await fetch('/.netlify/functions/delete-event', {
            method: 'POST',
            body: JSON.stringify({ eventId, shouldDelete })
        });
        if (!response.ok) throw new Error('伺服器錯誤');
        await loadAllData();
        renderEventManagerList();
    } catch (error) {
        alert('操作失敗！');
        console.error(error);
    }
}

function createDayCheckboxes() {
    const days = ['每日', '日', '一', '二', '三', '四', '五', '六'];
    days.forEach(day => {
        const div = document.createElement('div');
        div.innerHTML = `
            <label>
                <input type="checkbox" value="${day}"> ${day}
            </label>
        `;
        eventDaysCheckboxes.appendChild(div);
    });
}