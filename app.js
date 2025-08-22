// app.js (★加入高LV標記版)

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

function renderCombinedList(profile, timers, events) {
    const bossContainer = document.getElementById('boss-timers-container');
    const eventContainer = document.getElementById('custom-events-container');
    bossContainer.innerHTML = ''; 
    eventContainer.innerHTML = '';

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const createDateTime = (dateStr, timeStr) => {
        if (!dateStr || !timeStr || timeStr === '待確認') return null;
        return new Date(`${dateStr}T${timeStr}`);
    };
    
    const allBosses = profile.timers.map(boss => {
        let bossData = {};
        if (boss.type === 'fixed') {
            const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
            bossData = { 
                time: boss.time, 
                date: '每日固定', 
                isEditable: false,
                dateTime: createDateTime(todayStr, boss.time)
            };
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
        .filter(event => !event.deleted)
        .map(event => {
            const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
            return {
                ...event,
                itemType: 'event',
                dateTime: createDateTime(todayStr, event.time)
            };
        });

    const combinedList = [...allBosses, ...allEvents].filter(item => {
        if (!item.dateTime) return true;
        return item.dateTime >= now;
    });

    combinedList.sort((a, b) => {
        if (!a.dateTime && b.dateTime) return 1;
        if (a.dateTime && !b.dateTime) return -1;
        if (!a.dateTime && !b.dateTime) return 0;
        return a.dateTime - b.dateTime;
    });

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
            // ★★★ 新增的判斷邏輯在這裡 ★★★
            // 如果 BOSS 等級 >= 62，就加上 'high-level' 的 class
            if (item.level >= 62) {
                card.classList.add('high-level');
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