# FamilyOps

הלוז המשפחתי במבט אחד. Hebrew-first, RTL, mobile-first PWA.

## מה זה עושה

הבעיה היא לא חוסר מידע — היא מודעות מאוחרת. האפליקציה נותנת מקור אמת אחד
לשני ההורים, ודוחפת התראות מוקדמות לטלפון.

- **היום** — ציר זמן אחד: מה קורה, מי מסיע, מתי לצאת, מה לארוחת ערב
- **השבוע** — טקס התכנון: שיבוץ מסיעים, בניית תפריט, ראיית חריגות, אירועים חד-פעמיים
- **התראות** — תדריך ערב (21:00), יציאות הבוקר (07:00), שעתיים לפני יציאה,
  10 דקות לפני, מה להכין, ושינוי שבן/בת הזוג עשה

חגי ישראל מחושבים אוטומטית. חוג שנופל על חג **נשאר גלוי** ומסומן "לא מתקיים" —
אף פעם לא נעלם, כי מה שנעלם נשכח.

## מודל הנתונים

שלוש ישויות תחת `families/{familyId}`:

| ישות | מה זה |
|---|---|
| `activities` | תבנית חוג קבועה: ילד, ימים, שעות, שעת יציאה, מסיע לפי יום, מה להכין |
| `overrides` | **כל** שינוי ליום ספציפי: ביטול, הזזה, החלפת מסיע, אירוע חד-פעמי |
| `meals` | ארוחת ערב ליום. מזהה המסמך הוא התאריך, אז אין כפילויות |

הכלל המרכזי: **עריכת יום אחד לעולם לא נוגעת בתבנית.** היא כותבת override.

`buildDayView(date, {activities, overrides, meals})` היא פונקציה טהורה שמרכיבה
את היום בזמן ריצה. גם ה-UI וגם שולח ההתראות קוראים לה, אז שניהם תמיד מסכימים.
שום דבר לא מחושב מראש ונשמר, אז אין מה שיצא מסנכרון.

## Tech Stack

- Angular 21 (standalone components, signals)
- Firebase Auth + Firestore
- `@hebcal/core` ללוח השנה העברי
- FCM ל-Web Push
- GitHub Actions cron כטריגר ההתראות
- GitHub Pages

## הרצה

```bash
npm install --legacy-peer-deps
npm start          # http://localhost:4201
npm test           # vitest
npm run build      # production bundle
```

בפיתוח יש מסכי תצוגה מקדימה עם נתוני דוגמה, בלי צורך בחשבון:
`#/preview/today`, `#/preview/week`, `#/preview/activities`.

## התראות

**משלוח** דרך FCM. **תזמון** דרך `.github/workflows/notify.yml` שרץ כל 5 דקות.

```
src/app/core/notifications/planner.ts   פונקציה טהורה: plan(now, data) -> התראות
scripts/notify.ts                        Firebase Admin: קורא, מתכנן, שולח, מתעד
.github/workflows/notify.yml             cron */5
```

`planner.ts` לא יודע דבר על רשת או על Firestore, ולכן נבדק ביחידה מול שעון קפוא.
מעבר לטריגר אחר (למשל Cloudflare Workers) מחליף רק את `notify.yml` ו-`notify.ts`.

ריצות מתוזמנות ב-GitHub Actions עלולות להתעכב. לכן לכל כלל יש חלון סובלנות
(`GRACE_MINUTES`): תדריך שמאחר בעשר דקות עדיין נשלח, "צא עכשיו" שמאחר ברבע שעה
כבר לא. `notificationLog` מבטיח שכל התראה נשלחת בדיוק פעם אחת.

### מה צריך להגדיר לפני שזה עובד

1. **`FIREBASE_SERVICE_ACCOUNT`** — GitHub secret. Firebase Console >
   Project settings > Service accounts > Generate new private key. הדבק את כל ה-JSON.
2. **`vapidKey`** ב-`src/environments/environment*.ts` — Firebase Console >
   Cloud Messaging > Web configuration > Generate key pair.

בדיקה ידנית לפני שמפעילים את ה-cron:

```bash
FIREBASE_SERVICE_ACCOUNT='{...}' npm run notify:dry
```

## פריסה

דחיפה ל-`main` מפעילה את GitHub Actions. ידנית: `npm run deploy`.
