# CryptoEdge — מדריך פיתוח (קרא קודם!)

פלטפורמת מסחר קריפטו, קובץ HTML יחיד, עברית RTL.

## ⚠️ לקחים קשים — התחל מכאן תמיד

כשהמשתמש אומר "כלום לא קורה / לא נשמר / שעון חול / שגיאה" — **אל תנחש**. עבור ישר לסדר הזה:

1. **ודא שהמשתמש על הגרסה החדשה.** בכותרת יש חותמת `BUILD Tx` ומשתנה `window.__BUILD__`.
   עדכן את שניהם בכל שינוי משמעותי ובקש מהמשתמש להקריא מה כתוב. אם זה לא תואם — הוא על גרסה ישנה (בעיית פריסה/מטמון), לא באג בקוד.
2. **שגיאות JS מוצגות על המסך** דרך `window.addEventListener('error')` שמצייר באנר אדום בתחתית (id=`js-error-banner`). בקש צילום/העתקה של הבאנר במקום לבקש F12 — **המשתמש לא יכול/רוצה לפתוח F12**.
3. **בקש צילום מסך מוקדם.** אני לא רואה את המסך — צילום אחד חוסך 20 הודעות של ניחושים.
4. **אמת מול GitHub** עם כלי `mcp__github__list_commits` שהקוד באמת נדחף לשני הענפים.

## פריסה (Deployment)

- **Vercel** מארח (אוטומטי מ-GitHub). הלינק עם hash כמו `cryptoedge-5wefu14yt-...` הוא **צילום קפוא** ולא מתעדכן לעולם — תמיד הפנה לדומיין הקבוע (כפתור "Visit" בלוח Vercel).
- דוחפים **תמיד לשני הענפים**: `main` וגם `claude/beautiful-goldberg-TYQ61`.
  ```
  git push origin main && git push origin main:claude/beautiful-goldberg-TYQ61
  ```
- ה-Service Worker מוגדר ל**הרס עצמי** (sw.js מנקה מטמון + מבטל רישום). אל תחזיר caching.
- `git config user.email noreply@anthropic.com && user.name Claude` (אחרת "Unverified").

## ארכיטקטורה

- קובץ יחיד `index.html` (~11,700 שורות), 4 בלוקי `<script>`. הגדול הוא בלוק 3 (~שורה 7413+).
- **אל תיצור פונקציות async כפולות באותו בלוק** — זה מפיל את כל הבלוק בשקט.
- onclick handlers חייבים להיות גלובליים: `window.X = function(){}`.
- **נתונים**: localStorage עם prefixes (`cryptoedge_`, `mdb_`, `ij_entries`). כל כתיבה ל-localStorage מיורטת ומסונכרנת ל-**Supabase** (טבלת `app_kv`, עמודות key/value/updated_at).
- `window._sb` = לקוח Supabase (לא `_sb` מקומי — חייב על window כדי שכפתורים inline יגיעו אליו).
- מפתחות רגישים (`anthropic_apikey` וכו') הם STICKY — לא נדרסים מ-Supabase אם כבר קיימים מקומית.

## מקורות נתונים (CORS!)

- **Binance API חסום מהדפדפן (CORS)** — אל תשתמש. השתמש ב-**CoinGecko** ו-**CryptoCompare** (`min-api.cryptocompare.com`) כ-fallback.
- CoinGecko החינמי חוסם בקשות תכופות (rate-limit) — תמיד עם fallback ל-CryptoCompare.
- כל fetch באיסוף נתונים עטוף ב-timeout 8 שניות (Promise.race) כדי לא להיתקע.

## בדיקת תקינות לפני push

```bash
python3 -c "import re; html=open('index.html').read(); s=re.findall(r'<script(?![^>]*\bsrc=)[^>]*>(.*?)</script>',html,re.DOTALL); [open(f'/tmp/b_{i}.js','w').write(x) for i,x in enumerate(s)]"
cd /tmp && for i in 0 1 2 3; do node --check b_$i.js && echo "block $i OK"; done
```

## מפתחות

- Supabase URL: `https://riakzqevmugkfopkxhuz.supabase.co` (publishable key בקוד — בסדר, public)
- **לעולם אל תשים את ה-service_role (secret) key בקוד client-side.**
- מפתח Claude API נשמר ע"י המשתמש בנישת AI, עובד בכל האפליקציה.
</content>
