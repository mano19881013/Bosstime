// app.js (★診斷版本：顯示詳細錯誤訊息)

// --- 設定區 (省略，與之前相同) ---
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

// --- 全域變數 & DOM 元素 (省略，與之前相同) ---
let countdownInterval;
let hiddenBosses = [];
let showHidden = false;
let allEventsData = {};
let allProfileData = {};
const bossContainer = document.getElementById('boss-timers-container');
// ...其他元素...

// **** 核心修改處 ****
async function loadAllData() {
    bossContainer.innerHTML = '<p class="loading">正在讀取資料...</p>';
    try {
        allProfileData = GAME_PROFILE_DATA;

        const response = await fetch('/.netlify/functions/getData');
        
        // 增加對 response 狀態的檢查
        if (!response.ok) {
            // 丟出一個包含狀態碼的錯誤，方便診斷
            throw new Error(`伺服器回應錯誤，狀態碼: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        const timersData = data.timersData;
        const eventsData = data.eventsData;
        
        allEventsData = eventsData;
        // renderCombinedList(allProfileData, timersData, eventsData); // 暫時不渲染列表
        bossContainer.innerHTML = '<h2 style="color: green;">診斷模式：資料獲取成功！</h2><p>如果在 LINE 中看到此訊息，表示網路請求正常，問題可能在後續渲染。但在一般瀏覽器看到此訊息是正常的。</p>';

    } catch (error) {
        console.error('載入資料時發生錯誤:', error);
        
        // **** 主要修改：將詳細錯誤訊息直接顯示在畫面上 ****
        let errorMessage = '<h2>發生錯誤</h2>';
        errorMessage += '<p>很抱歉，在 LINE 中載入資料時遇到問題。</p>';
        errorMessage += '<p>請將以下灰色區塊的錯誤訊息截圖回報：</p>';
        errorMessage += '<div style="background-color:#eee; border:1px solid #ccc; padding:10px; font-family:monospace; word-wrap:break-word; text-align: left;">';
        errorMessage += `<strong>錯誤類型 (Name):</strong> ${error.name}<br><br>`;
        errorMessage += `<strong>錯誤訊息 (Message):</strong> ${error.message}<br><br>`;
        errorMessage += `<strong>堆疊追蹤 (Stack):</strong><br>${(error.stack || 'N/A').replace(/\n/g, '<br>')}`;
        errorMessage += '</div>';

        bossContainer.innerHTML = errorMessage;
    }
}

// 為了簡化診斷，暫時將其他函式保留，但主要關注 loadAllData
// ... 貼上您之前版本 app.js 的所有其他函式 ...
// --- 初始化 ---
document.addEventListener('DOMContentLoaded', () => {
    // requestNotificationPermission(); // 暫時關閉
    // loadSettings(); // 暫時關閉
    loadAllData();
    // setupEventListeners(); // 暫時關閉
    // createDayCheckboxes(); // 暫時關閉
});

// ... (請確保貼上其他所有函式，例如 createCardElement, processAndCombineData 等)
// (此處省略以節省篇幅，但您的檔案中需要包含它們)
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
        return {
            ...boss,
            ...bossData,
            itemType: 'boss',
            notify_minutes: 3
        };
    });

    const allEvents = Object.values(events)
        .filter(event => event && !event.deleted && event.days && (event.days.includes('每日') || event.days.includes(todayStr)))
        .map(event => ({ ...event, itemType: 'event', dateTime: createDateTime(todayStrFull, event.time) }));

    const combinedList = [...allBosses, ...allEvents];

    // **** 全新的排序邏輯 ****
    combinedList.sort((a, b) => {
        // 規則 1: 沒有時間的排最後
        if (!a.dateTime) return 1;
        if (!b.dateTime) return -1;

        const isAPast = a.dateTime < now;
        const isBPast = b.dateTime < now;

        // 規則 2: 未來的排在過去的前面
        if (isAPast && !isBPast) return 1; // a 已過去，b 未來，a 往後排
        if (!isAPast && isBPast) return -1; // a 未來，b 已過去，a 往前排

        // 規則 3: 如果都在未來或都在過去，則按時間先後排序
        return a.dateTime - b.dateTime;
    });

    return combinedList;
}
//... and so on for all other functions