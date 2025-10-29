# Google Apps Script Setup Instructions

## קבצים
- `Code.gs` - הקוד הראשי של Apps Script

## שלבי ההתקנה

### 1. יצירת Apps Script Project
1. פתח את הגיליון שלך ב-Google Sheets
2. לחץ על **Extensions** > **Apps Script**
3. מחק את הקוד הקיים והעתק את הקוד מ-`Code.gs`

### 2. פריסה כ-Web App
1. לחץ על **Deploy** > **New deployment**
2. בחר **Type**: "Web app"
3. הגדר:
   - **Execute as**: "Me" (המשתמש שלך)
   - **Who has access**: "Anyone"
4. לחץ **Deploy**
5. העתק את ה-**Web App URL** - תצטרך אותו באפליקציה

### 3. סכמת גיליונות
- Customers: כולל העמודות הבאות: מזהה, שם פרטי, שם משפחה, אימייל, סיסמה, טלפון, מנהל, תאריך הצטרפות, שם משתמש, סיסמת התחברות, נוצר בתאריך, המנוי מסתיים, ימים שנשארו, סוג מנוי
- Plans, Orders, (אופציונלי: ChatRooms, Messages)

### שימוש

#### אימות משתמש
בקשת GET:
```
https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec?action=signin&email=user@example.com&password=123456
```

#### הרשמה
בקשת POST כ-URL-encoded form (ללא כותרות מותאמות):
```
action=signup&email=user@example.com&password=123456&firstName=ישראל&lastName=כהן
```

#### פרופיל לפי אימייל
```
GET .../exec?action=getUserProfile&email=user@example.com
```

#### צ'אט
- קבלת חדרים: `GET .../exec?action=getChatRooms&userId=USER_ID`
- קבלת הודעות: `GET .../exec?action=getMessages&roomId=ROOM_ID`
- יצירת חדר: `POST form: action=createChatRoom&userId=USER_ID&subject=SUBJECT`
- שליחת הודעה: `POST form: action=sendMessage&roomId=ROOM_ID&senderId=USER_ID&content=TEXT&isAdmin=false`

## הערות חשובות
1. **CORS**: יש להימנע מבקשות preflight בצד הלקוח (לא לשלוח Content-Type מותאם בבקשות form)
2. **הרשאות**: ודא ש-"Who has access" מוגדר ל-"Anyone"
3. **פריסה מחדש**: כל שינוי בקוד דורש Deployment חדש
