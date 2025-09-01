# -*- coding: utf-8 -*-

# 這是一個部署在雲端 (例如 Render) 的小型 Web 伺服器
# 它的主要工作是：
# 1. 提供一個固定的公開網址給 LINE，用於接收訊息 (Webhook)。
# 2. 提供一個接口，讓您電腦上的計時器工具可以呼叫，以發送通知。

import os
from flask import Flask, request, abort, jsonify
from linebot import LineBotApi, WebhookHandler
from linebot.exceptions import InvalidSignatureError
from linebot.models import MessageEvent, TextMessage, TextSendMessage

app = Flask(__name__)

# 從環境變數讀取您的 LINE Bot 金鑰
# 在 Render 平台上，您可以輕易地設定這些環境變數
CHANNEL_SECRET = os.environ.get('LINE_CHANNEL_SECRET', 'YOUR_CHANNEL_SECRET')
CHANNEL_ACCESS_TOKEN = os.environ.get('LINE_CHANNEL_ACCESS_TOKEN', 'YOUR_CHANNEL_ACCESS_TOKEN')

# 確認金鑰是否已設定
if CHANNEL_SECRET == 'YOUR_CHANNEL_SECRET' or CHANNEL_ACCESS_TOKEN == 'YOUR_CHANNEL_ACCESS_TOKEN':
    print("警告：LINE_CHANNEL_SECRET 或 LINE_CHANNEL_ACCESS_TOKEN 未設定！")
    # 在實際部署時，如果未設定，程式應該要中止
    # exit()

line_bot_api = LineBotApi(CHANNEL_ACCESS_TOKEN)
handler = WebhookHandler(CHANNEL_SECRET)

@app.route("/")
def home():
    return "LINE Bot Webhook is running."

# 這個是 LINE Developers 後台 Webhook URL 要指向的地方
# 例如：https://your-app-name.onrender.com/callback
@app.route("/callback", methods=['POST'])
def callback():
    # 從請求標頭中獲取 X-Line-Signature
    signature = request.headers['X-Line-Signature']

    # 以文字形式獲取請求主體
    body = request.get_data(as_text=True)
    app.logger.info("Request body: " + body)

    # 處理 webhook 主體
    try:
        handler.handle(body, signature)
    except InvalidSignatureError:
        print("簽名錯誤，請檢查您的 Channel Secret。")
        abort(400)

    return 'OK'

# 這是在收到 LINE 訊息時的處理器
@handler.add(MessageEvent, message=TextMessage)
def handle_message(event):
    # 當使用者傳送訊息給 Bot 時，回覆固定的訊息
    # 未來您可以擴充這裡的功能，例如讓它回傳總表
    user_id = event.source.user_id
    reply_text = f"你好！你的 User ID 是：\n{user_id}\n\n我是一個通知機器人，目前還在學習如何對話。"
    line_bot_api.reply_message(
        event.reply_token,
        TextSendMessage(text=reply_text)
    )

# 【核心功能】
# 這是給您電腦上的計時器工具呼叫的接口
# 例如：https://your-app-name.onrender.com/send_notification
@app.route("/send_notification", methods=['POST'])
def send_notification():
    data = request.get_json()
    
    if not data:
        return jsonify({"status": "error", "message": "請求中沒有 JSON 資料"}), 400

    target_id = data.get('target_id')
    message_text = data.get('message')

    if not target_id or not message_text:
        return jsonify({"status": "error", "message": "缺少 'target_id' 或 'message'"}), 400

    try:
        # 使用 line_bot_api 主動推播訊息到指定的 target_id
        # target_id 可以是 User ID, Group ID, 或 Room ID
        line_bot_api.push_message(target_id, TextSendMessage(text=message_text))
        print(f"成功發送訊息到 {target_id}: {message_text}")
        return jsonify({"status": "success", "message": "訊息已發送"}), 200
    except Exception as e:
        print(f"發送訊息時發生錯誤: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == "__main__":
    # 在本地測試時，可以使用 5000 port
    # Render 會自動處理 port 的問題
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
