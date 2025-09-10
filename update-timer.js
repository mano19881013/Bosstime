// netlify/functions/update-timer.js (★已修正日期判斷邏輯)

const axios = require('axios');
const { Buffer } = require('buffer'); // NodeJS 環境中 Buffer 是內建的

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
        const PROFILE_FILE_PATH = 'game_profile.json';
        const API_BASE_URL = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/`;
        const HEADERS = {
            'Authorization': `token ${GITHUB_PAT}`,
            'Accept': 'application/vnd.github.v3+json'
        };

        const getProfileResponse = await axios.get(API_BASE_URL + PROFILE_FILE_PATH, { headers: HEADERS });
        const profileContentBase64 = getProfileResponse.data.content;
        const profileContentStr = Buffer.from(profileContentBase64, 'base64').toString('utf-8');
        const profileData = JSON.parse(profileContentStr);

        const bossProfile = profileData.timers.find(boss => boss.id === bossId);
        
        // ★★★ 這是已修正的核心邏輯 ★★★
        let finalDayOffset = 0;
        const now = new Date();
        
        // 建立一個代表「今天回報時間點」的 Date 物件
        const reportedTimeToday = new Date();
        const [hours, minutes] = time.split(':');
        reportedTimeToday.setHours(hours, minutes, 0, 0);

        if (reportedTimeToday < now) {
            // 如果回報的時間已經過去了，才使用 capture_day_offset
            // 如果 BOSS 沒有設定，則預設為 1 (隔天)
            finalDayOffset = (bossProfile && bossProfile.capture_day_offset) ? bossProfile.capture_day_offset : 1;
        } else {
            // 如果回報的時間還沒到，重生日期就是今天
            finalDayOffset = 0;
        }
        // ★★★ 核心邏輯結束 ★★★

        const getTimersResponse = await axios.get(API_BASE_URL + TIMERS_FILE_PATH, { headers: HEADERS });
        const currentSha = getTimersResponse.data.sha;
        const timersContentBase64 = getTimersResponse.data.content;
        const timersContentStr = Buffer.from(timersContentBase64, 'base64').toString('utf-8');
        const timersData = JSON.parse(timersContentStr);

        const newRespawnDate = new Date();
        newRespawnDate.setDate(newRespawnDate.getDate() + finalDayOffset);

        const yyyy = newRespawnDate.getFullYear();
        const mm = String(newRespawnDate.getMonth() + 1).padStart(2, '0');
        const dd = String(newRespawnDate.getDate()).padStart(2, '0');
        const newDate = `${yyyy}-${mm}-${dd}`;

        timersData[bossId] = {
            ...(timersData[bossId] || {}), // 增加保護，避免新BOSS出錯
            time: time,
            date: newDate,
            modified: new Date().toISOString(),
            is_predicted: false
        };

        const updatedContentStr = JSON.stringify(timersData, null, 2);
        const updatedContentBase64 = Buffer.from(updatedContentStr).toString('base64');
        
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
        if (error.response) {
            console.error('Error Data:', error.response.data);
        }
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Error updating file on GitHub' })
        };
    }
};