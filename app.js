// app.js (★真實串接後端最終版)

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
    const todayIndex = now.getDay();
    const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
    const todayStr = weekDays[todayIndex];

    const allBosses = profile.timers.map(boss => {
        let bossData;
        if (boss.type === 'fixed') {
            bossData = { time: boss.time, date: '每日固定', isEditable: false };
        } else {
            let remoteData = timers[boss.id] || { time: '待確認', date: '' };
            if (remoteData.time !== '待確認' && remoteData.date) {
                const bossTime = new Date(`${remoteData.date}T${remoteData.time}`);
                if (bossTime < now) {
                    remoteData = { time: '待確認', date: '' };
                }
            }
            bossData = { ...remoteData, isEditable: true };
        }
        return {
            ...boss,
            ...bossData,
            itemType: 'boss'
        };
    });

    const todayEvents = Object.values(events)
        .filter(event => !event.deleted && (event.days.includes('每日') || event.days.includes(todayStr)))
        .map(event => ({
            ...event,
            itemType: 'event'
        }));

    const combinedList = [...allBosses, ...todayEvents];

    combinedList.sort((a, b) => {
        const aIsPending = a.time === '待確認';
        const bIsPending = b.time === '待確認';
        if (aIsPending && !bIsPending) return 1;
        if (!aIsPending && bIsPending) return -1;
        return a.time.localeCompare(b.time);
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

// ★★★ 這是本次修改的核心：真實呼叫後端 ★★★
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
        // 顯示載入中提示
        alert('正在更新資料，請稍候...');

        // 真實發送請求到我們的 Netlify Function
        // URL '/.netlify/functions/update-timer' 是 Netlify 的標準函式路徑
        const response = await fetch('/.netlify/functions/update-timer', {
            method: 'POST',
            body: JSON.stringify(updateData),
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            // 如果後端回報錯誤
            throw new Error(`伺服器錯誤: ${response.statusText}`);
        }

        // 更新成功
        alert('更新成功！頁面將重新載入以顯示最新時間。');
        location.reload(); // 重新整理頁面以顯示更新後的資料

    } catch (error) {
        console.error('更新失敗:', error);
        alert(`更新失敗，請稍後再試。錯誤訊息: ${error.message}`);
    }
}