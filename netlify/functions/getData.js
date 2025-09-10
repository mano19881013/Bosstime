// netlify/functions/getData.js
const axios = require('axios');

// 從您的 app.js 複製過來的 GitHub 檔案路徑
const GITHUB_USER = 'mano19881013';
const GITHUB_REPO = 'Bosstime';
const GITHUB_BRANCH = 'main';
const TIMERS_DATA_URL = `https://raw.githubusercontent.com/${GITHUB_USER}/${GITHUB_REPO}/${GITHUB_BRANCH}/timers_data.json`;
const CUSTOM_EVENTS_URL = `https://raw.githubusercontent.com/${GITHUB_USER}/${GITHUB_REPO}/${GITHUB_BRANCH}/custom_events.json`;

exports.handler = async function(event, context) {
    // 加上時間戳確保每次都從 GitHub 抓取最新版本
    const timestamp = new Date().getTime();
    
    try {
        // 平行發出兩個請求
        const [timersRes, eventsRes] = await Promise.all([
            axios.get(`${TIMERS_DATA_URL}?t=${timestamp}`),
            axios.get(`${CUSTOM_EVENTS_URL}?t=${timestamp}`)
        ]);

        // 將兩個檔案的資料打包成一個 JSON 物件回傳
        const responseData = {
            timersData: timersRes.data,
            eventsData: eventsRes.data
        };

        return {
            statusCode: 200,
            headers: {
                "Content-Type": "application/json",
                // 告訴瀏覽器不要快取這個 function 的回傳結果
                "Cache-Control": "no-cache, no-store, must-revalidate"
            },
            body: JSON.stringify(responseData)
        };
    } catch (error) {
        console.error('Error fetching data from GitHub:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Failed to fetch data from GitHub.' })
        };
    }
};