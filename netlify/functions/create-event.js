// netlify/functions/update-event.js
const axios = require('axios');

exports.handler = async function(event, context) {
    if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };
    try {
        const { eventId, updatedData } = JSON.parse(event.body);
        const { GITHUB_PAT, REPO_OWNER, REPO_NAME } = process.env;
        const FILE_PATH = 'custom_events.json';
        const API_URL = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`;
        const HEADERS = { 'Authorization': `token ${GITHUB_PAT}`, 'Accept': 'application/vnd.github.v3+json' };

        const getFileResponse = await axios.get(API_URL, { headers: HEADERS });
        const { sha, content } = getFileResponse.data;
        const eventsData = JSON.parse(Buffer.from(content, 'base64').toString('utf-8'));

        if (eventsData[eventId]) {
            eventsData[eventId] = { ...eventsData[eventId], ...updatedData, modified: new Date().toISOString() };
        }

        const updatedContent = Buffer.from(JSON.stringify(eventsData, null, 2)).toString('base64');
        await axios.put(API_URL, {
            message: `[BOT] Update event: ${eventsData[eventId].name}`,
            content: updatedContent,
            sha: sha
        }, { headers: HEADERS });

        return { statusCode: 200, body: JSON.stringify({ message: 'Event updated' }) };
    } catch (error) {
        console.error('Error:', error);
        return { statusCode: 500, body: JSON.stringify({ message: 'Error updating event' }) };
    }
};