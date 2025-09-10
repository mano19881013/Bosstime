// app.js (★終極診斷版本：日誌追蹤)

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

// **** 核心修改處：全新的 loadAllData 函式 ****
async function loadAllData() {
    bossContainer.innerHTML = '<h2>診斷日誌 (請截圖回報)</h2>';
    try {
        const response = await fetch('/.netlify/functions/getData');
        bossContainer.innerHTML += '<p style="color:green;">✅ 步驟 1: Fetch 請求已發送。</p>';

        if (!response.ok) throw new Error(`伺服器回應錯誤: ${response.status} ${response.statusText}`);
        
        const data = await response.json();
        bossContainer.innerHTML += '<p style="color:green;">✅ 步驟 2: 成功從伺服器獲取並解析 JSON 資料。</p>';

        const profile = GAME_PROFILE_DATA;
        const timersData = data.timersData;
        const eventsData = data.eventsData;

        // 將後續所有操作包在另一個 try...catch 中，以捕捉渲染錯誤
        try {
            bossContainer.innerHTML += '<p>⏳ 步驟 3: 準備處理與排序資料...</p>';
            const now = new Date();
            let combinedList = processAndCombineData(profile, timersData, eventsData, now);
            bossContainer.innerHTML += `<p style="color:green;">✅ 步驟 4: 成功處理與排序資料 (共 ${combinedList.length} 個項目)。</p>`;

            bossContainer.innerHTML += '<p>⏳ 步驟 5: 準備渲染項目卡片...</p>';
            combinedList.forEach(item => {
                const card = createCardElement(item);
                // 為了日誌清晰，暫時不直接渲染，而是先放在一個容器裡
                // bossContainer.appendChild(card); 
            });
            bossContainer.innerHTML += `<p style="color:green;">✅ 步驟 6: 所有 ${combinedList.length} 個卡片資料已在記憶體中成功建立。</p>`;

            bossContainer.innerHTML += '<p>⏳ 步驟 7: 準備啟動倒數計時器...</p>';
            startCountdownTimers([]); // 傳入空陣列以避免執行倒數計時邏輯
            bossContainer.innerHTML += '<p style="color:green;">✅ 步驟 8: 診斷流程全部執行完畢！</p>';
            bossContainer.innerHTML += '<hr><p>如果看到此處，請重新整理頁面，以正常模式載入。</p>';


        } catch (renderError) {
            bossContainer.innerHTML += `<h3 style="color:red;">❌ 錯誤：在渲染步驟 (${renderError.step || '未知'}) 失敗</h3>`;
            bossContainer.innerHTML += '<div style="background-color:#fdd; border:1px solid red; padding:10px; font-family:monospace; word-wrap:break-word; text-align: left;">';
            bossContainer.innerHTML += `<strong>錯誤訊息:</strong> ${renderError.message}<br>`;
            bossContainer.innerHTML += `<strong>堆疊追蹤:</strong><br>${(renderError.stack || 'N/A').replace(/\n/g, '<br>')}`;
            bossContainer.innerHTML += '</div>';
        }

    } catch (fetchError) {
        // 捕捉 fetch 或 json 解析的錯誤
        bossContainer.innerHTML += `<h3 style="color:red;">❌ 錯誤：在網路請求步驟失敗</h3>`;
        bossContainer.innerHTML += '<div style="background-color:#fdd; border:1px solid red; padding:10px; font-family:monospace; word-wrap:break-word; text-align: left;">';
        bossContainer.innerHTML += `<strong>錯誤訊息:</strong> ${fetchError.message}<br>`;
        bossContainer.innerHTML += `<strong>堆疊追蹤:</strong><br>${(fetchError.stack || 'N/A').replace(/\n/g, '<br>')}`;
        bossContainer.innerHTML += '</div>';
    }
}

// --- 輔助函式 ---
const createDateTime = (dateStr, timeStr) => {
    if (!dateStr || !timeStr || timeStr === '待確認') return null;
    return new Date(`${dateStr}T${timeStr}`);
};

function processAndCombineData(profile, timers, events, now) {
    try {
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
    } catch (e) {
        e.step = 'processAndCombineData'; throw e;
    }
}

function createCardElement(item) {
    try {
        const card = document.createElement('div');
        card.className = 'card';
        // ... (以下為完整的函式內容)
        card.dataset.id = item.id;
        if (item.itemType === 'boss') {
            if (item.isEditable) card.classList.add('editable');
            if (item.level >= 62) card.classList.add('high-level');
            if (hiddenBosses.includes(item.id)) card.classList.add('is-hidden-item');
        } else {
            card.classList.add('event-card');
        }
        const isHidden = hiddenBosses.includes(item.id);
        const subInfoHTML = `<div class="sub-info">${item.itemType === 'boss' ? item.label : (Array.isArray(item.days) ? item.days.join(', ') : '未設定')}</div>`;
        const toggleButtonHTML = item.itemType === 'boss' ? `
            <button class="card-toggle-btn ${isHidden ? 'restore-btn' : 'hide-btn'}" title="${isHidden ? '恢復' : '隱藏'}">
                ${isHidden ? '⊕' : '✕'}
            </button>
        ` : '';
        let displayDate = '';
        if (item.date && item.date !== '每日固定') {
            displayDate = item.date.substring(5);
        }
        let timeDisplayHTML = `<div class="time-display ${item.time === '待確認' ? 'status-pending' : 'status-confirmed'}">${item.time}</div>`;
        if (item.dateTime && new Date(item.dateTime) >= new Date()) {
            timeDisplayHTML += `<div class="date-display" data-countdown-to="${item.dateTime.toISOString()}">--:--:--</div>`;
        } else {
            timeDisplayHTML += `<div class="date-display">${displayDate}</div>`;
        }
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
        return card;
    } catch (e) {
        e.step = 'createCardElement'; throw e;
    }
}

function startCountdownTimers(items) {
    try {
        if (countdownInterval) clearInterval(countdownInterval);
        // 在診斷模式下，我們不執行真正的倒數計時邏輯
        if (!items || items.length === 0) {
            return;
        }
        // ... (省略計時器邏輯)
    } catch(e) {
        e.step = 'startCountdownTimers'; throw e;
    }
}


// --- 其他所有函式 (請確保它們都存在於您的檔案中) ---
function setupEventListeners() {}
function loadSettings() {}
function saveHiddenBosses() {}
function saveShowHidden() {}
function renderCombinedList(profile, timers, events) {}
function openEditModal(bossId, bossName, currentTime) {}
function closeEditModal() {}
async function handleFormSubmit(event) {}
function showModalMessage(message, type) {}
function handleHideClick(bossId) {}
function handleUnhideClick(bossId) {}
function toggleShowHidden() {}
function updateToggleButton() {}
function formatTimeInput(e) {}
function openEventManager() {}
function closeEventManager() {}
function renderEventManagerList() {}
function fillEventForm(eventId) {}
function resetEventForm() {}
async function handleEventFormSubmit(event) {}
async function toggleEventDeleted(eventId, shouldDelete) {}
function createDayCheckboxes() {}
function requestNotificationPermission() {}
function scheduleNotifications(items) {}

// --- 初始化 --- (只執行 loadAllData)
document.addEventListener('DOMContentLoaded', () => {
    loadAllData();
});