const TelegramBot = require("node-telegram-bot-api");
const qrcode = require("qrcode");
const dotenv = require("dotenv").config();
const fs = require("fs");
const Jimp = require("jimp");
const jsQR = require("jsqr");
const TOKEN = process.env.TOKEN;

const bot = new TelegramBot(TOKEN, { polling: true });

const usersGeneratingQR = {};

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const welcomeMessage =
    "Welcome to QR generator bot. Send /generate and then your link to generate a QR code!";

  bot.sendMessage(chatId, welcomeMessage);
});

bot.onText(/\/generate/, (msg) => {
  const chatId = msg.chat.id;
  usersGeneratingQR[chatId] = true;
  bot.sendMessage(chatId, "I am waiting for your link to start!");
});

bot.onText(/\/read/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, "Send me a QR code image for reading!");
});

bot.on("text", async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (usersGeneratingQR[chatId]) {
    try {
      const qrCodeImagePath = await generateQRCode(text);

      bot
        .sendPhoto(chatId, fs.readFileSync(qrCodeImagePath))
        .then(() => {
          fs.unlinkSync(qrCodeImagePath);
        })
        .catch((error) => {
          console.error("Error sending image", error);
        });
    } catch (error) {
      console.error(error);
      bot.sendMessage(chatId, "Oops! Try again");
    }

    delete usersGeneratingQR[chatId];
  }
});

function generateQRCode(text) {
  return new Promise((resolve, reject) => {
    const qrCodeImagePath = `qr-code-${Date.now()}.png`;
    qrcode.toFile(
      qrCodeImagePath,
      text,
      { errorCorrectionLevel: "H" },
      (err) => {
        if (err) {
          reject(err);
        } else {
          resolve(qrCodeImagePath);
        }
      }
    );
  });
}

bot.on("photo", async (msg) => {
  const chatId = msg.chat.id;
  const photoId = msg.photo[msg.photo.length - 1].file_id;

  try {
    const photoInfo = await bot.getFile({ file_id: photoId });

    console.log('Info de la foto:', photoInfo);
    bot.sendMessage(chatId, `This is the QR code photo info: ${photoInfo}`);
    const photoPath = `https://api.telegram.org/file/bot${TOKEN}/${photoInfo.file_path}`;


    const image = await Jimp.read(photoPath);
    const imageBuffer = await image.getBufferAsync(Jimp.MIME_PNG);
    const qrCode = jsQR(imageBuffer, image.bitmap.width, image.bitmap.height);

    if (qrCode) {
      const qrCodeContent = qrCode.data;
      bot.sendMessage(chatId, `This is the QR code content: ${qrCodeContent}`);
    } else {
      bot.sendMessage(chatId, "Oops! We didn't find any link in this code.");
    }
  } catch (error) {
    console.error("Error processing image", error);
    bot.sendMessage(
      chatId,
      "Oops! Something went wrong while processing the image."
    );
  }
});
