-- Create testimonials table
CREATE TABLE public.testimonials (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  initials text NOT NULL,
  location text NOT NULL,
  rating integer NOT NULL DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
  text text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

-- Anyone can view active testimonials
CREATE POLICY "Anyone can view active testimonials"
  ON public.testimonials
  FOR SELECT
  USING (is_active = true);

-- Admins can manage testimonials
CREATE POLICY "Admins can manage testimonials"
  ON public.testimonials
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create features table
CREATE TABLE public.features (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text NOT NULL,
  icon text NOT NULL,
  gradient text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.features ENABLE ROW LEVEL SECURITY;

-- Anyone can view active features
CREATE POLICY "Anyone can view active features"
  ON public.features
  FOR SELECT
  USING (is_active = true);

-- Admins can manage features
CREATE POLICY "Admins can manage features"
  ON public.features
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create site_settings table
CREATE TABLE public.site_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key text NOT NULL UNIQUE,
  value jsonb NOT NULL,
  description text,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can view site settings
CREATE POLICY "Anyone can view site settings"
  ON public.site_settings
  FOR SELECT
  USING (true);

-- Admins can manage site settings
CREATE POLICY "Admins can manage site settings"
  ON public.site_settings
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Add triggers for updated_at
CREATE TRIGGER update_testimonials_updated_at
  BEFORE UPDATE ON public.testimonials
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_features_updated_at
  BEFORE UPDATE ON public.features
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_site_settings_updated_at
  BEFORE UPDATE ON public.site_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Insert existing testimonials data
INSERT INTO public.testimonials (name, initials, location, rating, text, display_order) VALUES
  ('דני כהן', 'דכ', 'תל אביב', 5, 'שירות מעולה! איכות הזרימה מושלמת וללא הפרעות. השירות לקוחות מקצועי ומהיר להגיב.', 1),
  ('שרה לוי', 'של', 'חיפה', 5, 'החבילה הפרימיום שווה כל שקל! איכות 4K מדהימה ומגוון ערוצים עצום.', 2),
  ('יוסי מזרחי', 'ימ', 'ירושלים', 5, 'עברתי מחברת אחרת והההבדל ניכר מאוד. כאן השירות באמת איכותי ויציב.', 3),
  ('מיכל אברהם', 'מא', 'באר שבע', 5, 'התקנה קלה ומהירה, ממשק ידידותי וחבילת הערוצים הישראליים מושלמת למשפחה.', 4),
  ('אלון גולדברג', 'אג', 'נתניה', 5, 'מחיר הוגן ביחס לאיכות. התמיכה הטכנית מעולה ותמיד זמינה לעזרה.', 5),
  ('רונית שמואל', 'רש', 'פתח תקוה', 5, 'מרוצה מאוד מהשירות. האפליקציה פשוטה לשימוש והערוצים עובדים בצורה מושלמת.', 6);

-- Insert existing features data
INSERT INTO public.features (title, description, icon, gradient, display_order) VALUES
  ('איכות פרימיום', 'סטרימינג באיכות 4K עם טכנולוגיה מתקדמת ללא הפרעות', 'Crown', 'from-yellow-400 to-orange-500', 1),
  ('ניהול לקוחות מתקדם', 'מערכת CRM מלאה עם מעקב אחר היסטוריית לקוחות והזמנות', 'Users', 'from-blue-400 to-cyan-500', 2),
  ('צ''אט בזמן אמת', 'תמיכה ושירות לקוחות עם תשובות אוטומטיות ותיעוד שיחות', 'MessageSquare', 'from-green-400 to-emerald-500', 3),
  ('מערכת תשלומים בטוחה', 'קבלת תשלומים מאובטחת עם תמיכה בקופונים והנחות', 'CreditCard', 'from-purple-400 to-pink-500', 4),
  ('אבטחה מתקדמת', 'הגנה מלאה על הנתונים שלך עם הצפנה ברמה הגבוהה ביותר', 'Shield', 'from-red-400 to-pink-500', 5),
  ('תמיכה בכל המכשירים', 'צפייה על סמארטפון, טאבלט, מחשב וטלוויזיה חכמה', 'Smartphone', 'from-indigo-400 to-purple-500', 6),
  ('תמיכה 24/7', 'צוות תמיכה מקצועי זמין עבורך בכל שעות היממה', 'Headphones', 'from-teal-400 to-blue-500', 7),
  ('תוכן בינלאומי', 'ערוצים מכל רחבי העולם עם דגש על תוכן ישראלי איכותי', 'Globe', 'from-orange-400 to-red-500', 8),
  ('מהירות מקסימלית', 'טעינה מהירה ומעבר חלק בין ערוצים ללא זמני המתנה', 'Zap', 'from-cyan-400 to-teal-500', 9);

-- Insert site settings
INSERT INTO public.site_settings (key, value, description) VALUES
  ('hero_stats', '{"customers": "10,000+", "channels": "500+", "quality": "4K", "support": "24/7"}', 'סטטיסטיקות לדף הבית'),
  ('testimonials_summary', '{"rating": 4.9, "total_reviews": 2500}', 'סיכום ביקורות לקוחות');