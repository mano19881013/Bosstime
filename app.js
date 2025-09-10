// app.js (★已過去的浮動BOSS顯示為待確認)

// --- 設定區 ---
const GITHUB_USER = 'mano19881013';
const GITHUB_REPO = 'Bosstime';
const GITHUB_BRANCH = 'main';
const GAME_PROFILE_DATA = {
  "game_name": "Boss計時器V3.0",
  "cloud_settings": { "repo_user": "mano19881013", "repo_name": "Bosstime", "timers_file": "timers_data.json", "events_file": "custom_events.json" },
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
  "filters": [ { "label": "全部", "min_level": 0 }, { "label": "LV.62+", "min_level": 62 } ]
};

// --- 全域變數 ---
let countdownInterval;
let hiddenBosses = [];
let showHidden = false;
let allEventsData = {};
let allProfileData = {};
let isReloading = false; 

// --- DOM 元素 ---
const bossContainer = document.getElementById('boss-timers-container');
const modalOverlay = document.getElementById('edit-modal-overlay');
const modal = document.getElementById('edit-modal');
const modalBossName = document.getElementById('modal-boss-name');
const editForm = document.getElementById('edit-form');
const timeInput = document.getElementById('time-input');
const cancelBtn = document.getElementById('cancel-btn');
const saveBtn = document.getElementById('save-btn');
const toggleHiddenBtn = document.getElementById('toggle-hidden-btn');
const manageEventsBtn = document.getElementById('manage-events-btn');

// --- 初始化 ---
document.addEventListener('DOMContentLoaded', () => {
    loadSettings();
    loadAllData();
    setupEventListeners();
});

async function loadAllData() {
    isReloading = true;
    bossContainer.innerHTML = '<p class="loading">正在讀取資料...</p>';
    try {
        allProfileData = GAME_PROFILE_DATA;
        const response = await fetch('/.netlify/functions/getData');
        if (!response.ok) {
            throw new Error(`伺服器錯誤: ${response.statusText}`);
        }
        const data = await response.json();
        allEventsData = data.eventsData;
        renderCombinedList(allProfileData, data.timersData, data.eventsData);
    } catch (error) {
        console.error('載入資料時發生錯誤:', error);
        bossContainer.innerHTML = `<p style="color: red;">資料載入失敗: ${error.message}</p>`;
    } finally {
        setTimeout(() => { isReloading = false; }, 2000);
    }
}

function renderCombinedList(profile, timers, events) {
    bossContainer.className = 'container';
    bossContainer.innerHTML = ''; 
    const now = new Date();
    let combinedList = processAndCombineData(profile, timers, events, now);
    
    if (!showHidden) {
        combinedList = combinedList.filter(item => !(item.itemType === 'boss' && hiddenBosses.includes(item.id)));
    }
    
    if (combinedList.length === 0) {
        bossContainer.innerHTML = '<p>沒有即將到來的項目。</p>';
        return;
    }

    combinedList.forEach(item => {
        const card = createCardElement(item);
        bossContainer.appendChild(card);
    });

    startCountdownTimers();
}

function createCardElement(item) {
    const card = document.createElement('div');
    card.className = 'card';
    
    const infoDiv = document.createElement('div');
    infoDiv.className = 'info';
    infoDiv.innerHTML = `<div class="name">${item.name || '未命名'}</div><div class="sub-info">${item.itemType === 'boss' ? item.label : (Array.isArray(item.days) ? item.days.join(', ') : '未設定')}</div>`;

    const timeInfoDiv = document.createElement('div');
    timeInfoDiv.className = 'time-info';
    const timeDisplayDiv = document.createElement('div');
    timeDisplayDiv.className = 'time-display';
    timeDisplayDiv.textContent = item.time || '待確認';
    const dateDisplayDiv = document.createElement('div');
    dateDisplayDiv.className = 'date-display';

    const now = new Date();
    if (item.dateTime && item.dateTime >= now) {
        dateDisplayDiv.dataset.countdownTo = item.dateTime.toISOString();
        dateDisplayDiv.textContent = '--:--:--';
    } else {
        dateDisplayDiv.textContent = (item.date && item.date !== '每日固定') ? item.date.substring(5) : '';
    }
    timeInfoDiv.appendChild(timeDisplayDiv);
    timeInfoDiv.appendChild(dateDisplayDiv);

    if (item.time === '待確認') timeDisplayDiv.classList.add('status-pending');
    else timeDisplayDiv.classList.add('status-confirmed');
    if (item.isEditable) card.classList.add('editable');
    if (item.level >= 62) card.classList.add('high-level');
    if (item.itemType === 'event') card.classList.add('event-card');
    
    card.appendChild(infoDiv);
    card.appendChild(timeInfoDiv);

    if (item.isEditable) {
        card.addEventListener('click', () => openEditModal(item.id, item.name, item.time));
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
                el.textContent = "已出現";
                el.removeAttribute('data-countdown-to');
                
                if (!isReloading) {
                    console.log("倒數計時結束，觸發刷新...");
                    setTimeout(loadAllData, 1000); 
                    isReloading = true;
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

// **** 核心修改處 ****
function processAndCombineData(profile, timers, events, now) {
    const todayStrFull = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
    const todayStr = weekDays[now.getDay()];
    const allBosses = profile.timers.map(boss => {
        let bossData = {};
        if (boss.type === 'fixed') {
            bossData = { time: boss.time, date: '每日固定', isEditable: false, dateTime: createDateTime(todayStrFull, boss.time) };
        } else {
            let remoteData = timers[boss.id] || { time: '待確認', date: '' };
            bossData = { ...remoteData, isEditable: true, dateTime: createDateTime(remoteData.date, remoteData.time) };
        }
        return { ...boss, ...bossData, itemType: 'boss' };
    });
    const allEvents = Object.values(events)
        .filter(event => event && !event.deleted && event.days && (event.days.includes('每日') || event.days.includes(todayStr)))
        .map(event => ({ ...event, itemType: 'event', dateTime: createDateTime(todayStrFull, event.time) }));
    const combinedList = [...allBosses, ...allEvents];
    const nowTimestamp = now.getTime();
    const upcoming = [], past = [], unknown = [];
    
    combinedList.forEach(item => {
        if (item.dateTime) {
            if (item.dateTime.getTime() < nowTimestamp) {
                // 如果是已過去的浮動BOSS，將其狀態改為待確認
                if (item.type === 'floating') {
                    item.time = '待確認';
                    item.date = '';
                }
                past.push(item);
            } else {
                upcoming.push(item);
            }
        } else {
            // 沒有時間的項目，如果不是固定的，也視為待確認
            if (item.type !== 'fixed') {
                 item.time = '待確認';
                 item.date = '';
            }
            unknown.push(item);
        }
    });

    upcoming.sort((a, b) => a.dateTime - b.dateTime);
    past.sort((a, b) => a.dateTime - b.dateTime);
    
    // 將待確認的項目放在列表最下方
    return [...upcoming, ...past.filter(p => p.type === 'fixed'), ...past.filter(p => p.type !== 'fixed'), ...unknown];
}

const createDateTime = (dateStr, timeStr) => {
    if (!dateStr || !timeStr || timeStr === '待確認') return null;
    return new Date(`${dateStr}T${timeStr}`);
};

function loadSettings() {
    hiddenBosses = JSON.parse(localStorage.getItem('hiddenBosses') || '[]');
    showHidden = JSON.parse(localStorage.getItem('showHidden') || 'false');
    if (toggleHiddenBtn) updateToggleButton();
}

function saveHiddenBosses() { localStorage.setItem('hiddenBosses', JSON.stringify(hiddenBosses)); }
function saveShowHidden() { localStorage.setItem('showHidden', JSON.stringify(showHidden)); }
function updateToggleButton() { toggleHiddenBtn.textContent = showHidden ? '隱藏已隱藏的 BOSS' : '顯示已隱藏的 BOSS'; }

function setupEventListeners() {
    if (editForm) {
        editForm.addEventListener('submit', handleFormSubmit);
        cancelBtn.addEventListener('click', closeEditModal);
        modalOverlay.addEventListener('click', (e) => { if (e.target === modalOverlay) closeEditModal(); });
        timeInput.addEventListener('input', formatTimeInput);
    }
    if (toggleHiddenBtn) toggleHiddenBtn.addEventListener('click', toggleShowHidden);
    if (manageEventsBtn) manageEventsBtn.addEventListener('click', () => alert('事件管理功能尚未啟用。'));
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
}

async function handleFormSubmit(event) {
    event.preventDefault();
    const bossId = modal.dataset.editingId;
    const newTime = timeInput.value;
    const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
    if (!newTime || !timeRegex.test(newTime)) {
        alert('請輸入有效的時間格式 (HH:MM)。');
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
        if (!response.ok) throw new Error(`伺服器錯誤: ${response.statusText}`);
        await loadAllData();
    } catch (error) {
        console.error('更新失敗:', error);
        alert(`更新 BOSS 的時間失敗，請檢查網路。`);
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
    if (input.length > 2) input = input.slice(0, 2) + ':' + input.slice(2);
    else input = input;
    e.target.value = input;
}