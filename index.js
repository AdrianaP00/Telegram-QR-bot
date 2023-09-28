const TelegramBot = require('node-telegram-bot-api');
const qrcode = require('qrcode');
const dotenv = require("dotenv").config()
const fs = require('fs');
const TOKEN = process.env.TOKEN;

const bot = new TelegramBot(TOKEN, { polling: true });

const usersGeneratingQR = {};

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const welcomeMessage = 'wlcome to QR generator bot send /generate and after your link to generate a QR code!';

  bot.sendMessage(chatId, welcomeMessage);
});

bot.onText(/\/generate/, (msg) => {
  const chatId = msg.chat.id;
  usersGeneratingQR[chatId] = true;
  bot.sendMessage(chatId, 'I wait your link for start!');
});

bot.on('text', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (usersGeneratingQR[chatId]) {
    try {
      const qrCodeImagePath = await generateQRCode(text);


      bot.sendPhoto(chatId, fs.readFileSync(qrCodeImagePath))
        .then(() => {

          fs.unlinkSync(qrCodeImagePath);
        })
        .catch((error) => {
          console.error('Error sending image', error);
        });

    } catch (error) {
      console.error(error);
      bot.sendMessage(chatId, 'Ops! Try again');
    }

 
    delete usersGeneratingQR[chatId];
  }
});

function generateQRCode(text) {
  return new Promise((resolve, reject) => {
    const qrCodeImagePath = `qr-code-${Date.now()}.png`;
    qrcode.toFile(qrCodeImagePath, text, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve(qrCodeImagePath);
      }
    });
  });
}
