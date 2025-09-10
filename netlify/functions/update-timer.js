// netlify/functions/update-timer.js
const axios = require('axios');
const { Buffer } = require('buffer');

const GAME_PROFILE_DATA = {
    "timers": [
        { "id": "boss_01", "capture_day_offset": 1 }, { "id": "boss_02", "capture_day_offset": 1 },
        { "id": "boss_03", "capture_day_offset": 1 }, { "id": "boss_04" }, { "id": "boss_05" },
        { "id": "boss_06" }, { "id": "boss_07" }, { "id": "boss_08" }, { "id": "boss_09" },
        { "id": "boss_10" }, { "id": "boss_11" }, { "id": "boss_12", "capture_day_offset": 2 },
        { "id": "boss_13" }, { "id": "boss_14" }, { "id": "boss_5d332052", "capture_day_offset": 1 }
    ]
};

exports.handler = async function(event, context) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { bossId, time } = JSON.parse(event.body);
        if (!bossId || !time) {
            return { statusCode: 400, body: 'Missing bossId or time' };
        }

        const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
        const REPO_URL = 'https://api.github.com/repos/mano19881013/Bosstime/contents/timers_data.json';
        const HEADERS = { 
            'Authorization': `token ${GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json'
        };

        const getFileResponse = await axios.get(REPO_URL, { headers: HEADERS });
        const currentData = JSON.parse(Buffer.from(getFileResponse.data.content, 'base64').toString('utf8'));
        const fileSha = getFileResponse.data.sha;

        const bossProfile = GAME_PROFILE_DATA.timers.find(b => b.id === bossId);
        const now = new Date();
        const reportedTimeToday = new Date();
        const [hours, minutes] = time.split(':');
        reportedTimeToday.setHours(hours, minutes, 0, 0);

        let finalDayOffset = 0;
        if (reportedTimeToday < now) {
            finalDayOffset = bossProfile?.capture_day_offset || 1;
        } else {
            finalDayOffset = 0;
        }

        const newRespawnDate = new Date();
        newRespawnDate.setDate(newRespawnDate.getDate() + finalDayOffset);
        
        const newDateString = `${newRespawnDate.getFullYear()}-${String(newRespawnDate.getMonth() + 1).padStart(2, '0')}-${String(newRespawnDate.getDate()).padStart(2, '0')}`;

        // **** 核心修改處 ****
        currentData[bossId] = {
            ...(currentData[bossId] || {}), // 如果 bossId 不存在，使用空物件作為預設值
            time: time,
            date: newDateString,
            modified: new Date().toISOString(),
            is_predicted: false,
        };

        const updatedContent = Buffer.from(JSON.stringify(currentData, null, 2)).toString('base64');
        await axios.put(REPO_URL, {
            message: `Update timer for ${bossId} to ${time}`,
            content: updatedContent,
            sha: fileSha,
            branch: 'main'
        }, { headers: HEADERS });

        return { statusCode: 200, body: JSON.stringify({ message: 'Timer updated successfully' }) };

    } catch (error) {
        console.error('Error updating timer:', error.response ? error.response.data : error.message);
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};