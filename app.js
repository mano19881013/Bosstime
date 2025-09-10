// app.js (★加入 BOSS 提前 3 分鐘通知功能版)

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
    {
      "id": "boss_01",
      "level": 50,
      "label": "LV.50",
      "name": "武庫拉",
      "type": "floating",
      "time": "",
      "capture_day_offset": 1
    },
    {
      "id": "boss_02",
      "level": 55,
      "label": "LV.55",
      "name": "格里貢",
      "type": "floating",
      "time": "",
      "capture_day_offset": 1
    },
    {
      "id": "boss_03",
      "level": 60,
      "label": "LV.60",
      "name": "帕洛提斯",
      "type": "floating",
      "time": "",
      "capture_day_offset": 1
    },
    {
      "id": "boss_04",
      "level": 62,
      "label": "LV.62",
      "name": "EZ-09",
      "type": "floating"
    },
    {
      "id": "boss_05",
      "level": 65,
      "label": "LV.65",
      "name": "普魯特",
      "type": "floating"
    },
    {
      "id": "boss_06",
      "level": 68,
      "label": "LV.68",
      "name": "哈尼文",
      "type": "floating"
    },
    {
      "id": "boss_07",
      "level": 72,
      "label": "LV.72",
      "name": "維瑟斯",
      "type": "floating"
    },
    {
      "id": "boss_08",
      "level": 77,
      "label": "LV.77",
      "name": "佩爾",
      "type": "floating"
    },
    {
      "id": "boss_09",
      "level": 78,
      "label": "LV.78",
      "name": "亞拉金",
      "type": "floating"
    },
    {
      "id": "boss_10",
      "level": 85,
      "label": "LV.85",
      "name": "卡威因",
      "type": "floating"
    },
    {
      "id": "boss_11",
      "level": 87,
      "label": "LV.87",
      "name": "厄瑞玻斯",
      "type": "floating"
    },
    {
      "id": "boss_12",
      "level": 90,
      "label": "LV.90",
      "name": "拉頓的幻影",
      "type": "floating",
      "time": "",
      "capture_day_offset": 2
    },
    {
      "id": "boss_13",
      "level": 94,
      "label": "LV.94",
      "name": "雷斯",
      "type": "floating"
    },
    {
      "id": "boss_14",
      "level": 104,
      "label": "LV.104",
      "name": "希歐多爾",
      "type": "floating"
    },
    {
      "id": "fixed_01",
      "level": 25,
      "label": "LV.25",
      "name": "埃奇納德",
      "type": "fixed",
      "time": "12:00"
    },
    {
      "id": "fixed_02",
      "level": 30,
      "label": "LV.30",
      "name": "斯吉拉",
      "type": "fixed",
      "time": "14:00"
    },
    {
      "id": "fixed_03",
      "level": 35,
      "label": "LV.35",
      "name": "蜥蜴人國王",
      "type": "fixed",
      "time": "16:00"
    },
    {
      "id": "fixed_04",
      "level": 40,
      "label": "LV.40",
      "name": "亞爾貢",
      "type": "fixed",
      "time": "18:00"
    },
    {
      "id": "fixed_05",
      "level": 45,
      "label": "LV.45",
      "name": "博卡頓",
      "type": "fixed",
      "time": "20:00"
    },
    {
      "id": "fixed_06",
      "level": 48,
      "label": "LV.48",
      "name": "泰米爾",
      "type": "fixed",
      "time": "22:00"
    },
    {
      "id": "fixed_07",
      "level": 63,
      "label": "LV.63",
      "name": "布萊登",
      "type": "fixed",
      "time": "23:00"
    },
    {
      "id": "boss_5d332052",
      "level": 112,
      "label": "LV.112",
      "name": "索尼安",
      "type": "floating",
      "time": "",
      "capture_day_offset": 1
    }
  ],
  "filters": [
    {
      "label": "全部",
      "min_level": 0
    },
    {
      "label": "LV.62+",
      "min_level": 62
    }
  ]
};
const TIMERS_DATA_URL = `https://raw.githubusercontent.com/${GITHUB_USER}/${GITHUB_REPO}/${GITHUB_BRANCH}/timers_data.json`;
const CUSTOM_EVENTS_URL = `https://raw.githubusercontent.com/${GITHUB_USER}/${GITHUB_REPO}/${GITHUB_BRANCH}/custom_events.json`;

// --- 全域變數 ---
let countdownInterval;
let hiddenBosses = [];
let showHidden = false;
let allEventsData = {};
let allProfileData = {}; // ★ 新增，用於樂觀更新

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
    requestNotificationPermission();
    loadSettings();
    loadAllData();
    setupEventListeners();
    createDayCheckboxes();
});

// --- 通知功能 ---
function requestNotificationPermission() {
    if (!("Notification" in window)) {
        console.log("這個瀏覽器不支援桌面通知。");
        return;
    }
    if (Notification.permission !== "granted" && Notification.permission !== "denied") {
        Notification.requestPermission().then(permission => {
            if (permission === "granted") {
                console.log("通知權限已獲得！");
            }
        });
    }
}

function scheduleNotifications(items) {
    if (Notification.permission !== "granted") {
        return;
    }
    const now = new Date().getTime();
    items.forEach(item => {
        if (item.dateTime && item.notify_minutes && item.notify_minutes > 0) {
            const notifyTime = item.dateTime.getTime() - (item.notify_minutes * 60 * 1000);
            if (notifyTime > now) {
                const delay = notifyTime - now;
                setTimeout(() => {
                    new Notification(`${item.name} 即將開始！`, {
                        body: `事件將於 ${item.notify_minutes} 分鐘後（${item.time}）開始。`,
                    });
                }, delay);
            }
        }
    });
}

// --- 核心函式 ---
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
    manageEventsBtn.addEventListener('click', openEventManager);
    closeEventManagerBtn.addEventListener('click', closeEventManager);
    eventManagerOverlay.addEventListener('click', (e) => {
        if (e.target === eventManagerOverlay) closeEventManager();
    });
    eventForm.addEventListener('submit', handleEventFormSubmit);
    eventCancelBtn.addEventListener('click', resetEventForm);
    timeInput.addEventListener('input', formatTimeInput);
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
        allProfileData = GAME_PROFILE_DATA;
        const [timersRes, eventsRes] = await Promise.all([
            fetch(TIMERS_DATA_URL),
            fetch(CUSTOM_EVENTS_URL)
        ]);
        const timersData = await timersRes.json();
        const eventsData = await eventsRes.json();
        allEventsData = eventsData;
        renderCombinedList(allProfileData, timersData, eventsData);
    } catch (error) {
        console.error('載入資料時發生錯誤:', error);
        bossContainer.innerHTML = '<p style="color: red;">資料載入失敗，請檢查網路連線或 GitHub 設定。</p>';
    }
}

function renderCombinedList(profile, timers, events) {
    bossContainer.innerHTML = '';
    const now = new Date();
    let combinedList = processAndCombineData(profile, timers, events, now);
    scheduleNotifications(combinedList);
    if (!showHidden) {
        combinedList = combinedList.filter(item => !(item.itemType === 'boss' && hiddenBosses.includes(item.id)));
    }
    combinedList.forEach(item => {
        const card = createCardElement(item);
        bossContainer.appendChild(card);
    });
    startCountdownTimers();
}

// ★★★ 修改點在這裡 ★★★
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
        return {
            ...boss,
            ...bossData,
            itemType: 'boss',
            notify_minutes: 3 // ★ 為所有 BOSS 都加上 3 分鐘的提醒設定 ★
        };
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
    const card = document.createElement('div');
    card.className = 'card';
    card.dataset.id = item.id;
    if (item.itemType === 'boss') {
        if (item.isEditable) card.classList.add('editable');
        if (item.level >= 62) card.classList.add('high-level');
        if (hiddenBosses.includes(item.id)) card.classList.add('is-hidden-item');
    } else {
        card.classList.add('event-card');
    }
    const isHidden = hiddenBosses.includes(item.id);
    const subInfoHTML = `<div class="sub-info">${item.itemType === 'boss' ? item.label : item.days.join(', ')}</div>`;
    const toggleButtonHTML = item.itemType === 'boss' ? `
        <button class="card-toggle-btn ${isHidden ? 'restore-btn' : 'hide-btn'}" title="${isHidden ? '恢復' : '隱藏'}">
            ${isHidden ? '⊕' : '✕'}
        </button>
    ` : '';
    const displayDate = item.date && item.date !== '每日固定' ? item.date.substring(5) : '';
    let timeDisplayHTML = `<div class="time-display ${item.time === '待確認' ? 'status-pending' : 'status-confirmed'}">${item.time}</div>`;
    timeDisplayHTML += item.dateTime ? `<div class="date-display" data-countdown-to="${item.dateTime.toISOString()}">--:--:--</div>` : `<div class="date-display">${displayDate}</div>`;
    card.innerHTML = `
        ${toggleButtonHTML}
        <div class="info">
            <div class="name">${item.name}</div>
            ${subInfoHTML}
        </div>
        <div class="time-info">
            ${timeDisplayHTML}
        </div>
    `;
    if (item.isEditable) {
        card.querySelector('.info').addEventListener('click', () => openEditModal(item.id, item.name, item.time));
        card.querySelector('.time-info').addEventListener('click', () => openEditModal(item.id, item.name, item.time));
    }
    const toggleBtn = card.querySelector('.card-toggle-btn');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            isHidden ? handleUnhideClick(item.id) : handleHideClick(item.id);
        });
    }
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

            if (diff <= 0) {
                const card = el.closest('.card');
                if (card) {
                    // 標記為已出現
                    el.textContent = "已出現";
                    el.removeAttribute('data-countdown-to'); // 停止這個倒數計時器

                    // 根據是否顯示隱藏的項目來決定是隱藏還是移到底部
                    if (!showHidden) {
                        const bossId = card.dataset.id;
                        if (!hiddenBosses.includes(bossId)) {
                             card.style.display = 'none'; // 直接隱藏
                        }
                    } else {
                        // 移至列表底部
                        bossContainer.appendChild(card);
                    }
                }
            } else {
                const hours = Math.floor(diff / 3600000);
                const minutes = Math.floor((diff % 3600000) / 60000);
                const seconds = Math.floor((diff % 60000) / 1000);
                el.textContent = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
            }
        });
    }, 1000);
}

function openEditModal(bossId, bossName, currentTime) { modal.dataset.editingId = bossId; modalBossName.textContent = bossName; timeInput.value = currentTime !== '待確認' ? currentTime : ''; modalOverlay.classList.remove('hidden'); timeInput.focus(); }
function closeEditModal() { modalOverlay.classList.add('hidden'); modalFeedback.classList.add('hidden'); saveBtn.disabled = false; timeInput.disabled = false; }
async function handleFormSubmit(event) {
    event.preventDefault();
    const bossId = modal.dataset.editingId;
    const newTime = timeInput.value;

    const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
    if (!newTime || !timeRegex.test(newTime)) {
        alert('請輸入有效的時間格式 (HH:MM)，例如 09:30 或 22:00。');
        return;
    }

    // --- 樂觀更新 (Optimistic UI Update) ---
    closeEditModal(); // 立即關閉視窗

    const cardToUpdate = document.querySelector(`.card[data-id="${bossId}"]`);
    if (!cardToUpdate) return;

    const timeDisplay = cardToUpdate.querySelector('.time-display');
    const countdownDisplay = cardToUpdate.querySelector('.date-display');

    // 儲存原始狀態，用於更新失敗時還原
    const originalTime = timeDisplay.textContent;
    const originalCountdownHTML = countdownDisplay.innerHTML;
    const originalCountdownAttr = countdownDisplay.getAttribute('data-countdown-to');
    const originalTimeClasses = timeDisplay.className;

    // 模擬後端的日期計算邏輯
    const bossProfile = allProfileData.timers.find(boss => boss.id === bossId);
    let finalDayOffset = 0;
    const now = new Date();
    if (bossProfile && bossProfile.capture_day_offset) {
        finalDayOffset = bossProfile.capture_day_offset;
    } else {
        const reportedTimeToday = new Date();
        const [hours, minutes] = newTime.split(':');
        reportedTimeToday.setHours(hours, minutes, 0, 0);
        if (reportedTimeToday < now) {
            finalDayOffset = 1; // 已過時間，算隔天
        } else {
            finalDayOffset = 0; // 未過時間，算今天
        }
    }
    const newRespawnDate = new Date();
    newRespawnDate.setDate(newRespawnDate.getDate() + finalDayOffset);
    const [newHours, newMinutes] = newTime.split(':');
    newRespawnDate.setHours(newHours, newMinutes, 0, 0);

    // 立即更新 UI
    timeDisplay.textContent = newTime;
    timeDisplay.className = 'time-display status-confirmed';
    countdownDisplay.setAttribute('data-countdown-to', newRespawnDate.toISOString());
    // --- 樂觀更新結束 ---

    try {
        const response = await fetch('/.netlify/functions/update-timer', {
            method: 'POST',
            body: JSON.stringify({ bossId, time: newTime }),
            headers: { 'Content-Type': 'application/json' }
        });
        if (!response.ok) {
            throw new Error(`伺服器錯誤: ${response.statusText}`);
        }
        // 更新成功，UI 已是最新，故不做任何事
        console.log(`Successfully updated ${bossId}`);
    } catch (error) {
        console.error('更新失敗:', error);
        // 更新失敗，還原 UI
        timeDisplay.textContent = originalTime;
        timeDisplay.className = originalTimeClasses;
        countdownDisplay.innerHTML = originalCountdownHTML;
        if (originalCountdownAttr) {
            countdownDisplay.setAttribute('data-countdown-to', originalCountdownAttr);
        } else {
            countdownDisplay.removeAttribute('data-countdown-to');
        }
        // 提示使用者
        alert(`更新 ${bossProfile ? bossProfile.name : 'BOSS'} 的時間失敗，請檢查網路或稍後再試。`);
    }
}
function showModalMessage(message, type) { modalMessage.textContent = message; modalMessage.className = type; }
function handleHideClick(bossId) { if (!hiddenBosses.includes(bossId)) { hiddenBosses.push(bossId); saveHiddenBosses(); document.querySelector(`.card[data-id="${bossId}"]`).style.display = 'none'; } }
function handleUnhideClick(bossId) { hiddenBosses = hiddenBosses.filter(id => id !== bossId); saveHiddenBosses(); loadAllData(); }
function toggleShowHidden() { showHidden = !showHidden; saveShowHidden(); updateToggleButton(); loadAllData(); }
function updateToggleButton() { toggleHiddenBtn.textContent = showHidden ? '隱藏已隱藏的 BOSS' : '顯示已隱藏的 BOSS'; }

function formatTimeInput(e) {
    let input = e.target.value.replace(/\D/g, ''); // 移除非數字字元
    if (input.length > 4) {
        input = input.slice(0, 4);
    }

    let formattedInput = '';
    if (input.length > 2) {
        formattedInput = input.slice(0, 2) + ':' + input.slice(2);
    } else {
        formattedInput = input;
    }

    e.target.value = formattedInput;
}

function openEventManager() { renderEventManagerList(); resetEventForm(); eventManagerOverlay.classList.remove('hidden'); }
function closeEventManager() { eventManagerOverlay.classList.add('hidden'); }
function renderEventManagerList() {
    eventListContainer.innerHTML = '';
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
                <button class="edit-event-btn">編輯</button>
                <button class="toggle-delete-event-btn">${event.deleted ? '恢復' : '刪除'}</button>
            </div>
        `;
        item.querySelector('.edit-event-btn').addEventListener('click', () => fillEventForm(event.id));
        item.querySelector('.toggle-delete-event-btn').addEventListener('click', () => toggleEventDeleted(event.id, !event.deleted));
        eventListContainer.appendChild(item);
    });
}
function fillEventForm(eventId) { const event = allEventsData[eventId]; eventIdInput.value = event.id; eventNameInput.value = event.name; eventTimeInput.value = event.time; eventNotifyInput.value = event.notify_minutes; const checkboxes = document.querySelectorAll('#event-days-checkboxes input'); checkboxes.forEach(cb => { cb.checked = event.days.includes(cb.value); }); }
function resetEventForm() { eventForm.reset(); eventIdInput.value = ''; const checkboxes = document.querySelectorAll('#event-days-checkboxes input'); checkboxes.forEach(cb => cb.checked = false); }
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
function createDayCheckboxes() { const days = ['每日', '日', '一', '二', '三', '四', '五', '六']; days.forEach(day => { const div = document.createElement('div'); div.innerHTML = `<label><input type="checkbox" value="${day}"> ${day}</label>`; eventDaysCheckboxes.appendChild(div); }); }