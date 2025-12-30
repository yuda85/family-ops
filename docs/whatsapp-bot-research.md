# WhatsApp Daily Notification Bot - Research

Research conducted: December 29, 2025

## Goal

Add a WhatsApp bot that sends personalized daily summaries each morning with upcoming events, rides, and tasks for the next 2 days.

**Requirements:**
- Daily scheduled notifications (morning summary)
- Personalized per-user (each user gets their assigned rides/tasks)
- Minimal/free budget preferred

---

## Option 1: Vercel + CallMeBot (FREE)

### Architecture
```
Vercel Cron (7:00 AM Israel)
    → Vercel Serverless Function
    → Firebase Firestore (read data)
    → CallMeBot API (send WhatsApp)
```

### Cost Breakdown
| Service | Cost |
|---------|------|
| Vercel Hobby Plan | $0 (100k invocations/month free) |
| CallMeBot API | $0 (completely free) |
| Firebase Firestore reads | $0 (within free tier) |
| **Total** | **$0/month** |

### How CallMeBot Works
1. Each user sends "I allow callmebot to send me messages" to +34 644 31 88 28
2. User receives an API key
3. Your backend calls: `https://api.callmebot.com/whatsapp.php?phone=PHONE&text=MESSAGE&apikey=KEY`

### Pros
- Completely free
- Simple HTTP API
- No business verification needed

### Cons
- Users must register manually with CallMeBot
- Text-only messages (no buttons, images)
- Third-party dependency (less reliable than official API)
- Rate limited

---

## Option 2: Firebase Cloud Functions + WhatsApp Cloud API

### Architecture
```
Firebase Cloud Functions (Scheduled)
    → Firestore (read data)
    → WhatsApp Cloud API (send messages)
```

### Cost Breakdown
| Service | Cost |
|---------|------|
| Firebase Blaze Plan | Pay-as-you-go (required) |
| Cloud Functions | ~$0.40/million invocations |
| WhatsApp Cloud API | First 1,000 conversations free, then $0.05-0.08 per conversation |
| **Total (5 users, daily)** | **$5-10/month** |

### How WhatsApp Cloud API Works
1. Create Meta Business Account (free)
2. Register a phone number for WhatsApp Business
3. Get API access token
4. Send messages via official REST API

### Pros
- Official Meta API (reliable)
- Rich messages (buttons, images, templates)
- All within Firebase ecosystem
- Better deliverability

### Cons
- Requires Firebase Blaze plan upgrade
- Meta Business verification process
- Monthly cost for business-initiated messages

--- 

## Option 3: Telegram Bot (Alternative)

If WhatsApp complexity is too high, Telegram is simpler:

| Aspect | Details |
|--------|---------|
| Cost | $0 |
| Setup | Create bot via @BotFather (5 minutes) |
| API | Simple HTTP API, no limits |
| Features | Rich messages, buttons, images, groups |

**Downside:** Users need Telegram app (not WhatsApp)

---

## Implementation Summary

### What Needs to Be Built

**Frontend (Angular):**
1. Update `FamilyMember` model with phone number + notification preferences
2. New settings page for notification configuration
3. Phone number input with validation
4. API key input (for CallMeBot) or opt-in flow (for official API)

**Backend:**
1. Scheduled function (cron job) running at 7:00 AM Israel time
2. Query Firestore for users with notifications enabled
3. For each user: fetch their assigned rides, events, tasks for next 2 days
4. Build personalized message in Hebrew/English
5. Send via WhatsApp API

### Files to Modify
- `src/app/core/family/family.models.ts` - Add notification fields
- `src/app/core/family/family.service.ts` - Add update methods
- `src/app/features/settings/` - New notification settings component

### New Backend Project
Either:
- `family-ops-notifications/` (Vercel project) - for Option 1
- `functions/` folder in main repo (Firebase Functions) - for Option 2

---

## Example Daily Message (Hebrew)

```
בוקר טוב, דני!

📅 סיכום יומי - 29/12

🚗 הסעות שלך:
• היום 14:00 - נועם לחוג כדורגל
• מחר 08:00 - מאיה לבית ספר

📆 אירועים קרובים:
• היום 16:00 - אסיפת הורים
• מחר 19:00 - ארוחת ערב משפחתית

✅ משימות שלך:
• [דחוף] לקבוע תור לרופא שיניים

יום נפלא!
```

---

## Recommendation

| If you want... | Choose... |
|----------------|-----------|
| Free, quick to set up | **Option 1: Vercel + CallMeBot** |
| Official API, all-in-one Firebase | **Option 2: Firebase + WhatsApp Cloud API** |
| Simplest possible solution | **Option 3: Telegram Bot** |

---

## Decision Pending

This research is for reference. Implementation will begin when ready.
