# Bakur Stock Keeper

🎯 ئارامی سیستەمەکە چییە؟

بەرنامەی وەب (Web Application) بۆ بەڕێوەبردنی مادەکان لە کۆگا بە ناوی
«باكوری خۆشەویست – سیستم بەڕێوەبردنی کۆگا»

ئەو کارانەی دەکات:

زانیاری هەموو مادەکان لە ستۆرجدا.

ڕێکخستنی کۆگا بە باركود / ناو / جۆر / برند.

پیشاندانی:

چەندت لە مادەیەک هەبوو؟

ئێستا چەند ماوە؟

کام مادەکان بەسەرچوون یان نزیکن لە بەسەرچوون؟

داخڵکردن بە سەردەستی یان بە ئیمپۆرت لە Excel.

ڕاپۆرت و داشبوارد بۆ بینینی کۆگا بە شێوەیەکی جوان.

🧱 بەشە سەرەکییەکانی وەب ئەپلیکەیشنەکە
1️⃣ داشبۆرد (Dashboard – سەرەکی)

تابلۆی سەرەکی کە لەسەرەوە کۆتایی دەمێنیت:

ژمارەی هەموو مادەکان.

کۆی کاڵای ماوە لە ستۆرج.

کۆی مادەی بەسەرچوو.

لیستی 5 مادەی:

زۆرترین خەرجکراو

نزیکترین بەسەرچوون

کەمترین ستۆک ( stock بسەر Minimum)

2️⃣ لیستی مادەکان (Items / Products)

تابلۆ/ڕیزست کە ئەمانە تێدا دەبینیت (لەسەر بنەمای Excelەکەت):

باركود

name – ناوی مادە

brand – براند

category – هاوپۆل ( مثلاً شيرى مندال، خۆراک، پاککەرەوە...)

unit – یەکە (غرام، دانه، پاکیت...)

quantity – ئەوەی ئێستا هەیە لە ستۆرج

بەرواری داخڵکردنى مادە

بەرواری إنتاج (مەرێن)

بەرواری بەسەرچوون

بەرواری بیرخستنەوە (کاتێ هەوڵدەدەیت پێش بەسەرچوون ئاگادارت بکات)

فێچرەکان:

گەڕان بە باركود / ناو / براند / هاوپۆل.

فلتەر:

تەنها مادەی نزیک بە بەسەرچوون.

تەنها مادەی کەمتر لە Min-Stock.

تەنها مادەی بەسەرچوو.

3️⃣ زانیاری وردی مادە (Item Detail Page)

کلیک لەسەر مادە → پەیجێکی تایبەت:

وێنەی کاڵا (Picture) – ئەو ستونەی picture.

ناو + باركود + برند + هاوپۆل + یەکە.

ڕیزی ستۆک:

چەندت هەبوو (Total In)

چەندت خەرجکراوە (Total Out)

چەندت ماوە (Current Quantity)

بەرواری داخڵکردن + بەرواری تولید + بەرواری بەسەرچوون.

لیستی هەموو ڕیکۆردەکانی:

داخڵکردن (کڕین لە کۆمپانیا / فرۆشیار)

دەرچوون (فرۆشتن / بەخشین)

گۆڕانکاری (Adjustments)

4️⃣ بەڕێوەبردنی ستۆک (Stock Movements)

ئەم بەشە گرنگترینە، چونکە ستۆک بە ڕیکۆردی گەڕاودا دەچێ:

فارم بۆ:

داخڵکردن مادە (Stock In)

هەڵبژاردنی مادە بە باركود/ناو

ژمارە

بەروار

تێبینی (نمونە: "کڕا لە کۆمپانیا X")

دەرکردنی مادە (Stock Out)

هەمان شت، بە جۆری "دەرچوون"

تێبینی: "فرۆشتن بۆ کڕیار"، "خەرجکراو بۆ بەخشین"...

هەر کات داخڵ یان دەرچوون دەکەیت:

تەواوی سەرنج دەچێتە سەر stock_movements

quantity مادەکە لە خشتەی items بە شێوەی خۆکارەوە نوێ دەکرێت.

5️⃣ بەشێ تایبەت بۆ بەسەرچوون (Expiry Management)

پەیجێکی جوان بۆ مادەی بەسەرچوو/نزیک بەسەرچوون:

فلتەر:

مادەی بەسەرچووی ڕۆژێک/هەفتەی ڕابردوو

مادەی دەبێت لە 30 ڕۆژ داهاتوو بەسەرچێت

مادەی بەشێوازێک لە "Red" نیشاندراون کە بەسەرچوون.

ڕاپۆرت بۆ:

چەند مادەت بەسەرچووە، چەند قازانج/زەرەر بۆت درووست کردوە.

6️⃣ Excel Import / Export 📥📤
Import (هێنانە ناو سیستەم)

فۆرمێکی ساده:

هەڵبژاردنی فایل Excel.

پیشاندانی مێپەکە:

باركود → barcode

name → name

quantity → quantity

brand → brand

category → category

unit → unit

بةروار داخلكردنى مادة → date_added

بةروارى انتاج → mfg_date

بةروارى بةسةرجون → exp_date

بةروارى بير خستنةوة → remind_date

هەڵبژاردن:

➕ زیادکردن بەسەر مادەی هەنووکەوە (new).

یان 🔁 نوێکردنەوەی مادەی هەیە بە بنەمای باركود.

Export (هێنانە دەرەوە)

هەر کات دەتوانیت:

هەموو کۆگا

یان بە فلتەر (هاوپۆلێک، براندێک...)
بە Excel دابه‌زێنیت بۆ BackUp یان کار بە Excel بکەیت.

7️⃣ بەشەکانی ڕێکخستن (Settings)

Categories – زیاد/سڕینەوە/گۆڕینی هاوپۆل (مثلاً شيرى مندال، حەلوێک، دوایی پەراوێز...)

Brands – بەڕێوەبردنی برندەکان.

Locations (ئەگەر کۆگا زیاتر لە یەک شوێنی هەیە: گوند A، گوند B…)

Users & Roles – مامەڵەدار و رولەکان:

Admin – هەموو شت

Storekeeper – بەڕێوەبردنی ستۆک

Viewer – تەنها بینین

🗄 ساختاری داتا/خشتەکان (Database Design)
1️⃣ جدول items

id

barcode

name

brand_id → (جدول brands)

category_id → (جدول categories)

unit

current_quantity

date_added

mfg_date

exp_date

remind_date

picture_url (لە داهاتوو فایلی وێنە)

2️⃣ جدول stock_movements

id

item_id

movement_type → (IN / OUT / ADJUST)

quantity

movement_date

note

created_by → (user_id)

3️⃣ جدولا تر

categories(id, name)

brands(id, name)

users(id, name, role, username, password_hash)

locations(id, name) (ئەگەر دیاری بکەیت)

🔁 فلووە ڕۆژانەکان (جۆری کارکردن)
فلوو 1: داخڵکردنی مادەی تازە

لە منوی Stock In

باركود داخڵبکە → ئەگەر نیە، پەیجێکی "Create New Item" بکرێتەوە.

نووسینی تەنها quantity + بەروار + تێبینی.

سیستەم:

ڕیکۆرد لە stock_movements.

current_quantity زیاد دەکات.

فلوو 2: دەرکردنی مادە (فرۆشتن / بەخشین)

منوی Stock Out

هەڵبژاردنی مادە.

quantity دەرچوون داخڵ بکە.

سیستەم:

stock_movements → OUT

current_quantity كەم دەکات.

فلوو 3: چاودێری بەسەرچوون

هەر کات لۆگین دەکەیت داشبۆرد نیشانت دەدات:

"X مادە هەیە کە بەسەرچون"

"Y مادە هەیە کە لە ماوەی 30 ڕۆژدا بەسەر دەچن"

کلیک → پەیجی Expiry Management.

🛠 پێشنیاری تێکنیکل (ئەگەر دەتەوێت پێشکەش)

لەبەر ئەوەی تۆ پێشتر زۆر بە Python و Ubuntu کاردەکەیت، پلانم ئەوەیە:

Back-end: Django + Django REST Framework

Database: PostgreSQL یان MySQL

Front-end: ساده‌ترین شێوە:

یان Django Templates بۆ هەموو پەیجەکان

یان داهاتوو React/Vue ئەگەر با لە دوایان UI گەورە بکەین.

Auth: Session-based login

Import/Export: بە بەکارهێنانی pandas بۆ خوێندنی Excel، یان خۆی Django+openpyxl.

ئەم جۆرە ئامادەکردنەش بۆ داهاتوو زۆر خۆشە، چونکە:

دەتوانین لە داهاتوو مۆبایل ئەپ یان Telegram Botیش لەسەر هەمان API دروست بکەین بۆ باکوری خۆشەویست.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://koga1.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/cc2e0e7b-4846-4abe-a6a6-0ee31dfedb3c).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
