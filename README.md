# Telegram-QR-bot

bot.on("photo", async (msg) => {
  const chatId = msg.chat.id;
  const photoId = msg.photo[msg.photo.length - 1].file_id; 
