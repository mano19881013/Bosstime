// app.js (★最終測試版：極簡渲染)

// --- 設定區 ---
const GITHUB_USER = 'mano19881013';
const GITHUB_REPO = 'Bosstime';
const GITHUB_BRANCH = 'main';
const GAME_PROFILE_DATA = {
  "game_name": "Boss計時器V3.0",
  "cloud_settings": {
    "repo_user": "mano19881013",
    "repo_name": "Bosstime",
    "timers_file": "timers_data.json",
    "events_file": "custom_events.json"
  },
  "timers": [
    { "id": "boss_01", "level": 50, "label": "LV.50", "name": "武庫拉", "type": "floating", "time": "", "capture_day_offset": 1 },
    { "id": "boss_02", "level": 55, "label": "LV.55", "name": "格里貢", "type": "floating", "time": "", "capture_day_offset": 1 },
    { "id": "boss_03", "level": 60, "label": "LV.60", "name": "帕洛提斯", "type": "floating", "time": "", "capture_day_offset": 1 },
    { "id": "boss_04", "level": 62, "label": "LV.62", "name": "EZ-09", "type": "floating" },
    { "id": "boss_05", "level": 65, "label": "LV.65", "name": "普魯特", "type": "floating" },
    { "id": "boss_06", "level": 68, "label": "LV.68", "name": "哈尼文", "type": "floating" },
    { "id": "boss_07", "level": 72, "label": "LV.72", "name": "維瑟斯", "type": "floating" },
    { "id": "boss_08", "level": 77, "label": "LV.77", "name": "佩爾", "type": "floating" },
    { "id": "boss_09", "level": 78, "label": "LV.78", "name": "亞拉金", "type": "floating" },
    { "id": "boss_10", "level": 85, "label": "LV.85", "name": "卡威因", "type": "floating" },
    { "id": "boss_11", "level": 87, "label": "LV.87", "name": "厄瑞玻斯", "type": "floating" },
    { "id": "boss_12", "level": 90, "label": "LV.90", "name": "拉頓的幻影", "type": "floating", "time": "", "capture_day_offset": 2 },
    { "id": "boss_13", "level": 94, "label": "LV.94", "name": "雷斯", "type": "floating" },
    { "id": "boss_14", "level": 104, "label": "LV.104", "name": "希歐多爾", "type": "floating" },
    { "id": "fixed_01", "level": 25, "label": "LV.25", "name": "埃奇納德", "type": "fixed", "time": "12:00" },
    { "id": "fixed_02", "level": 30, "label": "LV.30", "name": "斯吉拉", "type": "fixed", "time": "14:00" },
    { "id": "fixed_03", "level": 35, "label": "LV.35", "name": "蜥蜴人國王", "type": "fixed", "time": "16:00" },
    { "id": "fixed_04", "level": 40, "label": "LV.40", "name": "亞爾貢", "type": "fixed", "time": "18:00" },
    { "id": "fixed_05", "level": 45, "label": "LV.45", "name": "博卡頓", "type": "fixed", "time": "20:00" },
    { "id": "fixed_06", "level": 48, "label": "LV.48", "name": "泰米爾", "type": "fixed", "time": "22:00" },
    { "id": "fixed_07", "level": 63, "label": "LV.63", "name": "布萊登", "type": "fixed", "time": "23:00" },
    { "id": "boss_5d332052", "level": 112, "label": "LV.112", "name": "索尼安", "type": "floating", "time": "", "capture_day_offset": 1 }
  ],
  "filters": [
    { "label": "全部", "min_level": 0 },
    { "label": "LV.62+", "min_level": 62 }
  ]
};

// --- 全域變數 ---
let countdownInterval;
let hiddenBosses = [];
let showHidden = false;
let allEventsData = {};
let allProfileData = {};

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
    createDayCheckboxes();
});

async function loadAllData() {
    bossContainer.innerHTML = '<p class="loading">正在讀取資料...</p>';
    try {
        allProfileData = GAME_PROFILE_DATA;
        const response = await fetch('/.netlify/functions/getData');
        if (!response.ok) {
            throw new Error(`伺服器錯誤: ${response.statusText}`);
        }
        const data = await response.json();
        const timersData = data.timersData;
        const eventsData = data.eventsData;
        allEventsData = eventsData;
        renderCombinedList(allProfileData, timersData, eventsData);
    } catch (error) {
        console.error('載入資料時發生錯誤:', error);
        bossContainer.innerHTML = `<p style="color: red;">資料載入失敗: ${error.message}</p>`;
    }
}

// **** 核心修改處：renderCombinedList ****
function renderCombinedList(profile, timers, events) {
    // 移除 bossContainer 內的 grid 樣式，避免極簡模式跑版
    bossContainer.className = '';
    bossContainer.innerHTML = ''; // 清空容器
    const now = new Date();
    let combinedList = processAndCombineData(profile, timers, events, now);
    
    if (!showHidden) {
        combinedList = combinedList.filter(item => !(item.itemType === 'boss' && hiddenBosses.includes(item.id)));
    }
    
    if (combinedList.length === 0) {
        const emptyMsg = document.createElement('p');
        emptyMsg.textContent = '沒有即將到來的項目。';
        bossContainer.appendChild(emptyMsg);
        return;
    }

    // *** 使用極簡模式渲染列表 ***
    combinedList.forEach(item => {
        const simpleCard = document.createElement('div');
        const timeStr = item.time || '待確認';
        const dateStr = item.date && item.date !== '每日固定' ? `(${item.date.substring(5)})` : '';
        const nameStr = item.name || '未命名項目';

        let countdownSpan = '';
        if (item.dateTime && item.dateTime > now) {
            countdownSpan = `<span data-countdown-to="${item.dateTime.toISOString()}"></span>`;
        }
        
        simpleCard.innerHTML = `[${timeStr}] ${dateStr} - <strong>${nameStr}</strong> ${countdownSpan}`;
        
        simpleCard.style.cssText = 'padding: 8px; border-bottom: 1px solid #eee; font-size: 16px;';
        
        bossContainer.appendChild(simpleCard);
    });

    // 啟動極簡版的倒數計時器
    startSimpleCountdownTimers();
}

function startSimpleCountdownTimers() {
    if (countdownInterval) clearInterval(countdownInterval);
    countdownInterval = setInterval(() => {
        const countdownElements = document.querySelectorAll('[data-countdown-to]');
        countdownElements.forEach(el => {
            const targetDate = new Date(el.dataset.countdownTo);
            const now = new Date();
            const diff = targetDate - now;

            if (diff <= 0) {
                el.textContent = " (已出現)";
                el.removeAttribute('data-countdown-to');
            } else {
                const hours = Math.floor(diff / 3600000);
                const minutes = Math.floor((diff % 3600000) / 60000);
                const seconds = Math.floor((diff % 60000) / 1000);
                el.textContent = ` (倒數 ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')})`;
            }
        });
    }, 1000);
}


// --- 其他所有函式 (確保完整性) ---
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
            bossData = { ...remoteData, isEditable: true, dateTime: floatingDateTime };
        }
        return { ...boss, ...bossData, itemType: 'boss', notify_minutes: 3 };
    });
    const allEvents = Object.values(events)
        .filter(event => event && !event.deleted && event.days && (event.days.includes('每日') || event.days.includes(todayStr)))
        .map(event => ({ ...event, itemType: 'event', dateTime: createDateTime(todayStrFull, event.time) }));
    const combinedList = [...allBosses, ...allEvents];
    const nowTimestamp = now.getTime();
    const upcoming = [], past = [], unknown = [];
    combinedList.forEach(item => {
        if (item.dateTime) {
            if (item.dateTime.getTime() < nowTimestamp) past.push(item);
            else upcoming.push(item);
        } else {
            unknown.push(item);
        }
    });
    upcoming.sort((a, b) => a.dateTime - b.dateTime);
    past.sort((a, b) => a.dateTime - b.dateTime);
    return [...upcoming, ...past, ...unknown];
}

const createDateTime = (dateStr, timeStr) => {
    if (!dateStr || !timeStr || timeStr === '待確認') return null;
    return new Date(`${dateStr}T${timeStr}`);
};

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

function updateToggleButton() {
    toggleHiddenBtn.textContent = showHidden ? '隱藏已隱藏的 BOSS' : '顯示已隱藏的 BOSS';
}

function setupEventListeners() {
    editForm.addEventListener('submit', handleFormSubmit);
    cancelBtn.addEventListener('click', closeEditModal);
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) closeEditModal();
    });
    toggleHiddenBtn.addEventListener('click', toggleShowHidden);
    manageEventsBtn.addEventListener('click', openEventManager);
    closeEventManagerBtn.addEventListener('click', closeEventManager);
    eventManagerOverlay.addEventListener('click', (e) => {
        if (e.target === eventManagerOverlay) closeEventManager();
    });
    eventForm.addEventListener('submit', handleEventFormSubmit);
    eventCancelBtn.addEventListener('click', resetEventForm);
    timeInput.addEventListener('input', formatTimeInput);
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

async function handleFormSubmit(event) {
    event.preventDefault();
    const bossId = modal.dataset.editingId;
    const newTime = timeInput.value;
    const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
    if (!newTime || !timeRegex.test(newTime)) {
        alert('請輸入有效的時間格式 (HH:MM)，例如 09:30 或 22:00。');
        return;
    }
    closeEditModal(); 
    bossContainer.innerHTML = '<p class="loading">正在更新時間並重新排序...</p>';
    try {
        const response = await fetch('/.netlify/functions/update-timer', {
            method: 'POST',
            body: JSON.stringify({ bossId, time: newTime }),
            headers: { 'Content-Type': 'application/json' }
        });
        if (!response.ok) {
            throw new Error(`伺服器錯誤: ${response.statusText}`);
        }
        await loadAllData();
    } catch (error) {
        console.error('更新失敗:', error);
        alert(`更新 BOSS 的時間失敗，請檢查網路或稍後再試。`);
        await loadAllData();
    }
}

function toggleShowHidden() { 
    showHidden = !showHidden; 
    saveShowHidden(); 
    updateToggleButton(); 
    loadAllData(); 
}

function formatTimeInput(e) {
    let input = e.target.value.replace(/\D/g, '');
    if (input.length > 4) input = input.slice(0, 4);
    let formattedInput = '';
    if (input.length > 2) {
        formattedInput = input.slice(0, 2) + ':' + input.slice(2);
    } else {
        formattedInput = input;
    }
    e.target.value = formattedInput;
}

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
    const sortedEvents = Object.values(allEventsData)
        .filter(event => event && !event.deleted)
        .sort((a, b) => new Date(b.modified) - new Date(a.modified));
    sortedEvents.forEach(event => {
        const item = document.createElement('div');
        item.className = 'event-list-item';
        const daysText = Array.isArray(event.days) ? event.days.join(', ') : '未設定';
        item.innerHTML = `
            <div class="event-item-info">
                <strong>${event.name || '未命名'}</strong> (${event.time || '未知時間'}) - [${daysText}]
            </div>
            <div class="event-item-actions">
                <button class="edit-event-btn">編輯</button>
                <button class="toggle-delete-event-btn">刪除</button>
            </div>
        `;
        item.querySelector('.edit-event-btn').addEventListener('click', () => fillEventForm(event.id));
        item.querySelector('.toggle-delete-event-btn').addEventListener('click', () => toggleEventDeleted(event.id, true));
        eventListContainer.appendChild(item);
    });
}

function fillEventForm(eventId) { 
    const event = allEventsData[eventId]; 
    if (!event) return;
    eventIdInput.value = event.id || ''; 
    eventNameInput.value = event.name || ''; 
    eventTimeInput.value = event.time || ''; 
    eventNotifyInput.value = event.notify_minutes || 0; 
    const checkboxes = document.querySelectorAll('#event-days-checkboxes input'); 
    checkboxes.forEach(cb => { 
        cb.checked = Array.isArray(event.days) && event.days.includes(cb.value); 
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
    if (selectedDays.length === 0) { alert('請至少選擇一個重複日！'); return; }
    const eventData = { name: eventNameInput.value, time: eventTimeInput.value, days: selectedDays, notify_minutes: parseInt(eventNotifyInput.value) || 0, };
    const endpoint = eventId ? '/.netlify/functions/update-event' : '/.netlify/functions/create-event';
    const body = eventId ? { eventId, updatedData: eventData } : eventData;
    try {
        const response = await fetch(endpoint, { method: 'POST', body: JSON.stringify(body) });
        if (!response.ok) throw new Error('伺服器錯誤');
        alert('事件儲存成功！');
        resetEventForm();
        await loadAllData();
        renderEventManagerList();
    } catch (error) { alert('事件儲存失敗！'); console.error(error); }
}

async function toggleEventDeleted(eventId, shouldDelete) {
    try {
        const response = await fetch('/.netlify/functions/delete-event', { method: 'POST', body: JSON.stringify({ eventId, shouldDelete }) });
        if (!response.ok) throw new Error('伺服器錯誤');
        await loadAllData();
        renderEventManagerList();
    } catch (error) { alert('操作失敗！'); console.error(error); }
}

function createDayCheckboxes() { 
    const days = ['每日', '日', '一', '二', '三', '四', '五', '六']; 
    days.forEach(day => { 
        const div = document.createElement('div'); 
        div.innerHTML = `<label><input type="checkbox" value="${day}"> ${day}</label>`; 
        eventDaysCheckboxes.appendChild(div); 
    }); 
}

function requestNotificationPermission() { /* 省略 */ }
function scheduleNotifications(items) { /* 省略 */ }
function handleHideClick(bossId) { /* 省略 */ }
function handleUnhideClick(bossId) { /* 省略 */ }