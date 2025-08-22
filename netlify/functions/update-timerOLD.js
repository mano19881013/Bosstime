// netlify/functions/update-timer.js

const axios = require('axios');

exports.handler = async function(event, context) {
    // 只接受 POST 請求
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        // 1. 從前端請求中取得 bossId 和 time
        const { bossId, time } = JSON.parse(event.body);
        if (!bossId || !time) {
            return { statusCode: 400, body: 'Missing bossId or time' };
        }

        // 2. 從環境變數讀取安全資訊
        const { GITHUB_PAT, REPO_OWNER, REPO_NAME } = process.env;
        const FILE_PATH = 'timers_data.json';
        const API_URL = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`;
        const HEADERS = {
            'Authorization': `token ${GITHUB_PAT}`,
            'Accept': 'application/vnd.github.v3+json'
        };

        // 3. 取得目前檔案的 SHA 和內容
        const getFileResponse = await axios.get(API_URL, { headers: HEADERS });
        const currentSha = getFileResponse.data.sha;
        const contentBase64 = getFileResponse.data.content;
        
        // 將 Base64 內容解碼成 UTF-8 字串，再解析成 JSON 物件
        const contentStr = Buffer.from(contentBase64, 'base64').toString('utf-8');
        const timersData = JSON.parse(contentStr);

        // 4. 更新 JSON 物件中的資料
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');

        timersData[bossId] = {
            time: time,
            date: `${yyyy}-${mm}-${dd}`,
            modified: today.toISOString(),
            is_predicted: false
        };

        // 5. 將更新後的 JSON 物件轉回字串，再編碼成 Base64
        const updatedContentStr = JSON.stringify(timersData, null, 2);
        const updatedContentBase64 = Buffer.from(updatedContentStr).toString('base64');
        
        // 6. 發送 PUT 請求來更新 GitHub 上的檔案
        await axios.put(API_URL, {
            message: `[BOT] Update ${bossId} to ${time}`,
            content: updatedContentBase64,
            sha: currentSha // 必須提供舊的 SHA 值
        }, { headers: HEADERS });

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'File updated successfully' })
        };

    } catch (error) {
        console.error('Error updating GitHub file:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Error updating file on GitHub' })
        };
    }
};