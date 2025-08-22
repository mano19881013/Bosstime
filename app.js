// app.js (★精準時序最終版)

// --- 設定區 ---
const GITHUB_USER = 'mano19881013';
const GITHUB_REPO = 'Bosstime';
const GITHUB_BRANCH = 'main'; // 通常是 'main' 或 'master'

// --- 檔案路徑 ---
const PROFILE_PATH = './game_profile.json';
const TIMERS_DATA_URL = `https://raw.githubusercontent.com/${GITHUB_USER}/${GITHUB_REPO}/${GITHUB_BRANCH}/timers_data.json`;
const CUSTOM_EVENTS_URL = `https://raw.githubusercontent.com/${GITHUB_USER}/${GITHUB_REPO}/${GITHUB_BRANCH}/custom_events.json`;

// --- 主程式邏輯 ---
document.addEventListener('DOMContentLoaded', () => {
    loadAllData();
});

async function loadAllData() {
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
        const bossContainer = document.getElementById('boss-timers-container');
        bossContainer.innerHTML = '<p style="color: red;">資料載入失敗，請檢查網路連線或 GitHub 設定。</p>';
    }
}

// ★★★ 全新的精準時序渲染與排序函式 ★★★
function renderCombinedList(profile, timers, events) {
    const bossContainer = document.getElementById('boss-timers-container');
    const eventContainer = document.getElementById('custom-events-container');
    bossContainer.innerHTML = ''; 
    eventContainer.innerHTML = '';

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()); //今天的零點
    
    // --- 輔助函式：將 YYYY-MM-DD 和 HH:MM 組合成 Date 物件 ---
    const createDateTime = (dateStr, timeStr) => {
        if (!dateStr || !timeStr || timeStr === '待確認') return null;
        return new Date(`${dateStr}T${timeStr}`);
    };
    
    // 步驟 1: 處理所有 BOSS 資料
    const allBosses = profile.timers.map(boss => {
        let bossData = {};
        if (boss.type === 'fixed') {
            // 為固定 BOSS 建立今天的日期時間物件
            const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
            bossData = { 
                time: boss.time, 
                date: '每日固定', 
                isEditable: false,
                dateTime: createDateTime(todayStr, boss.time) // 使用今天的日期
            };
        } else { // floating
            let remoteData = timers[boss.id] || { time: '待確認', date: '' };
            const floatingDateTime = createDateTime(remoteData.date, remoteData.time);

            // 如果浮動 BOSS 時間已過，設為待確認
            if (floatingDateTime && floatingDateTime < now) {
                remoteData = { time: '待確認', date: '' };
                bossData = { ...remoteData, isEditable: true, dateTime: null };
            } else {
                bossData = { ...remoteData, isEditable: true, dateTime: floatingDateTime };
            }
        }
        return { ...boss, ...bossData, itemType: 'boss' };
    });

    // 步驟 2: 處理所有事件資料
    const allEvents = Object.values(events)
        .filter(event => !event.deleted)
        .map(event => {
            const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
            return {
                ...event,
                itemType: 'event',
                dateTime: createDateTime(todayStr, event.time) // 所有事件都視為今天
            };
        });

    // 步驟 3: 合併 BOSS 和事件，並過濾掉所有已經過去的固定項目
    const combinedList = [...allBosses, ...allEvents].filter(item => {
        // 如果項目沒有有效的 dateTime (例如待確認)，則保留
        if (!item.dateTime) return true;
        // 如果項目的 dateTime 早於現在，則過濾掉
        return item.dateTime >= now;
    });

    // 步驟 4: 統一排序
    combinedList.sort((a, b) => {
        // 待確認的(沒有dateTime)或沒有時間的排在最後
        if (!a.dateTime && b.dateTime) return 1;
        if (a.dateTime && !b.dateTime) return -1;
        if (!a.dateTime && !b.dateTime) return 0;

        // 其他情況直接比較 Date 物件
        return a.dateTime - b.dateTime;
    });

    // 步驟 5: 渲染合併後的列表
    combinedList.forEach(item => {
        const isPending = item.time === '待確認';
        const statusClass = isPending ? 'status-pending' : 'status-confirmed';
        
        const card = document.createElement('div');
        card.className = 'card';

        let subInfo = '';
        if (item.itemType === 'boss') {
            subInfo = `<div class="sub-info">${item.label}</div>`;
            if (item.isEditable) {
                card.classList.add('editable');
                card.addEventListener('click', () => handleEditTime(item.id, item.name));
            }
        } else {
            subInfo = `<div class="sub-info">${item.days.join(', ')}</div>`;
            card.classList.add('event-card');
        }

        const displayDate = item.date && item.date !== '每日固定' ? item.date.substring(5) : '';
        
        card.innerHTML = `
            <div class="info">
                <div class="name">${item.name}</div>
                ${subInfo}
            </div>
            <div class="time-info">
                <div class="time-display ${statusClass}">${item.time}</div>
                <div class="date-display">${displayDate}</div>
            </div>
        `;
        bossContainer.appendChild(card);
    });
}


// 時間解析函式 (維持不變)
function parseAndValidateTime(input) {
    if (!input) return null;
    const standardRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (standardRegex.test(input)) return input;
    const digits = input.replace(/\D/g, '');
    if (digits.length === 4) {
        const hour = digits.substring(0, 2);
        const minute = digits.substring(2, 4);
        const formattedTime = `${hour}:${minute}`;
        if (standardRegex.test(formattedTime)) return formattedTime;
    }
    if (digits.length === 3) {
        const hour = '0' + digits.substring(0, 1);
        const minute = digits.substring(1, 3);
        const formattedTime = `${hour}:${minute}`;
        if (standardRegex.test(formattedTime)) return formattedTime;
    }
    return null;
}

// 編輯時間函式 (維持不變)
async function handleEditTime(bossId, bossName) {
    const userInput = prompt(`請輸入「${bossName}」的新時間 (可輸入 1234 或 12:34)`);
    if (userInput === null) return;
    const newTime = parseAndValidateTime(userInput);
    if (!newTime) {
        alert('格式錯誤！請輸入有效的時間，例如 1234, 905 或 12:34。');
        return;
    }
    const updateData = {
        bossId: bossId,
        time: newTime
    };

    try {
        alert('正在更新資料，請稍候...');
        const response = await fetch('/.netlify/functions/update-timer', {
            method: 'POST',
            body: JSON.stringify(updateData),
            headers: { 'Content-Type': 'application/json' }
        });
        if (!response.ok) {
            throw new Error(`伺服器錯誤: ${response.statusText}`);
        }
        alert('更新成功！頁面將重新載入以顯示最新時間。');
        location.reload();
    } catch (error) {
        console.error('更新失敗:', error);
        alert(`更新失敗，請稍後再試。錯誤訊息: ${error.message}`);
    }
}