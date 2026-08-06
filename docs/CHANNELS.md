# راهنمای گرفتن توکن کانال‌ها

تمام مقادیر زیر از طریق **داشبورد ← تب کانال‌ها** وارد می‌شوند. هیچ‌کدام داخل کد یا مخزن ذخیره نمی‌شوند؛
در D1 با `AES-GCM` رمزنگاری می‌شوند و در پاسخ API همیشه ماسک‌شده (`••••`) برمی‌گردند.

---

## ✈️ تلگرام

1. در تلگرام به [@BotFather](https://t.me/BotFather) پیام دهید و `/newbot` بزنید.
2. توکنی مانند `123456789:AAE...` دریافت می‌کنید ← `bot_token`
3. ربات را در کانال خود **ادمین** کنید (دسترسی ارسال پیام).
4. `chat_id` را به‌صورت `@yourchannel` یا شناسهٔ عددی (`-100...`) بدهید.

---

## 💬 بله (Bale)

API بله تقریباً عین تلگرام است.

1. در بله به [@botfather](https://ble.ir/botfather) پیام دهید و بازوی خود را بسازید.
2. توکن ← `bot_token`
3. بازو را در کانال ادمین کنید و `chat_id` را بدهید.

آدرس پیش‌فرض: `https://tapi.bale.ai`

---

## 🟠 ایتا (Eitaa)

ایتا API رسمی باز ندارد؛ از سرویس **ایتایار** استفاده می‌شود.

1. در [eitaayar.ir](https://eitaayar.ir) ثبت‌نام کنید.
2. کانال خود را اضافه کنید و توکن اختصاصی بگیرید ← `token`
3. `chat_id` = شناسهٔ کانال بدون `@` (مثلاً `mychannel`).

آدرس پیش‌فرض: `https://eitaayar.ir/api`

---

## 🟣 روبیکا (Rubika)

1. در روبیکا به BotFather پیام دهید و ربات بسازید.
2. توکن ← `bot_token`
3. `chat_id` را از مستندات [rubika.ir/botapi](https://rubika.ir/botapi/methods) بگیرید.

آدرس پیش‌فرض: `https://botapi.rubika.ir/v3`

---

## 𝕏 توییتر / X

1. در [developer.x.com](https://developer.x.com) یک App بسازید.
2. در بخش **User authentication settings** دسترسی را روی **Read and Write** بگذارید.
3. چهار مقدار زیر را بردارید:
   - `api_key` (Consumer Key)
   - `api_secret` (Consumer Secret)
   - `access_token`
   - `access_secret`

> اگر پس از تغییر دسترسی به Read and Write، access token را **دوباره تولید** نکنید، خطای `403 Forbidden` می‌گیرید.

متن بلندتر از ۲۸۰ کاراکتر به‌صورت **ثرد (thread)** ارسال می‌شود.
