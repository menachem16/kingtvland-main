# Google Apps Script Setup Instructions

## קבצים
- `Code.gs` - הקוד הראשי של Apps Script -בדיקת מצב

## שלבי ההתקנה

### 1. יצירת Apps Script Project
1. פתח את הגיליון שלך ב-Google Sheets
2. לחץ על **Extensions** > **Apps Script**
3. מחק את הקוד הקיים והעתק את הקוד מ-`Code.gs`

### 2. עדכון ההגדרות
ערוך את המשתנים הבאים בקוד:
```javascript
const SUPABASE_URL = 'YOUR_SUPABASE_URL'; // https://xxxxx.supabase.co
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
const SHEET_NAME = 'Customers'; // שם הגיליון
```

### 3. פריסה כ-Web App
1. לחץ על **Deploy** > **New deployment**
2. בחר **Type**: "Web app"
3. הגדר:
   - **Execute as**: "Me" (המשתמש שלך)
   - **Who has access**: "Anyone"
4. לחץ **Deploy**
5. העתק את ה-**Web App URL** - תצטרך אותו באפליקציה

### 4. הרשאות
- בפעם הראשונה תתבקש לאשר הרשאות
- אשר גישה לגיליון ולחיבורים חיצוניים

### 5. הוספת עמודות אימות (אופציונלי)
אם הגיליון שלך עדיין לא כולל עמודות אימייל וסיסמה:
1. בעורך Apps Script, לחץ על **Run** > **addAuthColumns**
2. זה יוסיף עמודות "אימייל" ו"סיסמה" לגיליון

### 6. הגדרת סנכרון אוטומטי (אופציונלי)
להפעלת סנכרון אוטומטי מ-Supabase כל שעה:
1. בעורך Apps Script, לחץ על **Run** > **setupTriggers**
2. זה ייצור trigger שמריץ את הסנכרון כל שעה

## שימוש

### אימות משתמש
כדי לאמת משתמש, שלח בקשת GET ל-Web App URL:
```
https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec?email=user@example.com&password=123456
```

תגובה מוצלחת:
```json
{
  "success": true,
  "message": "Authentication successful",
  "data": {
    "מזהה": "123",
    "שם פרטי": "ישראל",
    "אימייל": "user@example.com",
    ...
  }
}
```

### סנכרון נתונים
כדי לסנכרן נתונים מהאפליקציה לגיליון, שלח בקשת POST:
```javascript
fetch('YOUR_WEB_APP_URL', {
  method: 'POST',
  body: JSON.stringify({
    headers: ['מזהה', 'שם פרטי', ...],
    customers: [
      ['123', 'ישראל', ...],
      ['456', 'דוד', ...]
    ]
  })
});
```

## הערות חשובות

1. **אבטחה**: הסיסמאות מאוחסנות בטקסט פשוט בגיליון. לשימוש בסיסי בלבד!
2. **מגבלות**: Google Apps Script מוגבל ל-6 דקות זמן ריצה ו-20,000 בקשות ליום
3. **CORS**: Web App תומך אוטומטית ב-CORS מכל מקור
4. **עדכונים**: כל שינוי בקוד דורש deployment חדש (או שימוש ב-Test Deployment)

## פתרון בעיות

### השגיאה "Script function not found"
- וודא ששמרת את הקוד לפני הריצה
- נסה לרענן את הדף

### "Authorization required"
- אשר את ההרשאות בפעם הראשונה
- וודא ש-"Who has access" מוגדר ל-"Anyone"

### הנתונים לא מתעדכנים
- בדוק את ה-Logs ב-Apps Script (View > Logs)
- וודא ש-SUPABASE_URL ו-SUPABASE_ANON_KEY נכונים
