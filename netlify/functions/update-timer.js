// netlify/functions/update-timer.js (★最終修正版 - 採用最穩定的「完全取代」邏輯)

const axios = require('axios');
const { Buffer } = require('buffer');

exports.handler = async function(event, context) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { bossId, time } = JSON.parse(event.body);
        if (!bossId || !time) {
            return { statusCode: 400, body: 'Missing bossId or time' };
        }

        const { GITHUB_PAT, REPO_OWNER, REPO_NAME } = process.env;
        const TIMERS_FILE_PATH = 'timers_data.json';
        const PROFILE_FILE_PATH = 'game_profile.json'; // 假設您有這個檔案，用於讀取BOSS設定
        const API_BASE_URL = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/`;
        const HEADERS = {
            'Authorization': `token ${GITHUB_PAT}`,
            'Accept': 'application/vnd.github.v3+json'
        };

        // 讀取 BOSS 設定檔來判斷位移天數
        const getProfileResponse = await axios.get(API_BASE_URL + PROFILE_FILE_PATH, { headers: HEADERS });
        const profileContentStr = Buffer.from(getProfileResponse.data.content, 'base64').toString('utf-8');
        const profileData = JSON.parse(profileContentStr);
        const bossProfile = profileData.timers.find(boss => boss.id === bossId);
        
        // 正確的日期判斷邏輯
        let finalDayOffset = 0;
        const now = new Date();
        const reportedTimeToday = new Date();
        const [hours, minutes] = time.split(':');
        reportedTimeToday.setHours(hours, minutes, 0, 0);

        if (reportedTimeToday < now) {
            finalDayOffset = (bossProfile && bossProfile.capture_day_offset) ? bossProfile.capture_day_offset : 1;
        } else {
            finalDayOffset = 0;
        }

        // 獲取目前的計時器資料檔案
        const getTimersResponse = await axios.get(API_BASE_URL + TIMERS_FILE_PATH, { headers: HEADERS });
        const currentSha = getTimersResponse.data.sha;
        const timersContentStr = Buffer.from(getTimersResponse.data.content, 'base64').toString('utf-8');
        const timersData = JSON.parse(timersContentStr);

        // 計算新日期
        const newRespawnDate = new Date();
        newRespawnDate.setDate(newRespawnDate.getDate() + finalDayOffset);
        const yyyy = newRespawnDate.getFullYear();
        const mm = String(newRespawnDate.getMonth() + 1).padStart(2, '0');
        const dd = String(newRespawnDate.getDate()).padStart(2, '0');
        const newDate = `${yyyy}-${mm}-${dd}`;

        // ★★★ 核心修正處 ★★★
        // 使用「完全取代」的方式建立一個全新的、乾淨的物件
        timersData[bossId] = {
            time: time,
            date: newDate,
            modified: new Date().toISOString(),
            is_predicted: false
        };
        // ★★★ 修改結束 ★★★

        const updatedContentStr = JSON.stringify(timersData, null, 2);
        const updatedContentBase64 = Buffer.from(updatedContentStr).toString('base64');
        
        // 將更新後的內容寫回 GitHub
        await axios.put(API_BASE_URL + TIMERS_FILE_PATH, {
            message: `[BOT] Update ${bossId} to ${time} on ${newDate}`,
            content: updatedContentBase64,
            sha: currentSha
        }, { headers: HEADERS });

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'File updated successfully' })
        };

    } catch (error) {
        console.error('Error updating GitHub file:', error);
        if (error.response) { console.error('Error Data:', error.response.data); }
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Error updating file on GitHub' })
        };
    }
};