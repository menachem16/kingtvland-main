import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Star } from 'lucide-react';

interface Testimonial {
  id: string;
  name: string;
  initials: string;
  location: string;
  rating: number;
  text: string;
}

interface TestimonialsSummary {
  rating: number;
  total_reviews: number;
}

// Static testimonials data
const defaultTestimonials: Testimonial[] = [
  {
    id: '1',
    name: 'דוד כהן',
    initials: 'דכ',
    location: 'תל אביב',
    rating: 5,
    text: 'שירות מעולה ואיכות שידור מצוינת. ממליץ מאוד!'
  },
  {
    id: '2',
    name: 'שרה לוי',
    initials: 'של',
    location: 'ירושלים',
    rating: 5,
    text: 'מבחר ערוצים מדהים ותמיכה מקצועית. בדיוק מה שחיפשתי.'
  },
  {
    id: '3',
    name: 'משה דוד',
    initials: 'מד',
    location: 'חיפה',
    rating: 5,
    text: 'השירות הכי טוב שהיה לי. לא חוזר לשירות אחר!'
  },
];

const defaultSummary: TestimonialsSummary = {
  rating: 4.9,
  total_reviews: 2500
};

const TestimonialsSection = () => {
  // Use static data instead of Supabase
  const testimonials = defaultTestimonials;
  const testimonialsLoading = false;
  const summary = defaultSummary;
  return (
    <section className="py-20 px-4 bg-muted/30">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            מה הלקוחות שלנו אומרים
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            אלפי לקוחות מרוצים נהנים מהשירות שלנו מדי יום
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {testimonialsLoading ? (
            Array.from({ length: 6 }).map((_, idx) => (
              <Card key={idx} className="glass">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    <Skeleton className="h-12 w-12 rounded-full mr-4" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                  <Skeleton className="h-4 w-20 mb-4" />
                  <Skeleton className="h-16 w-full" />
                </CardContent>
              </Card>
            ))
          ) : (
            testimonials?.map((testimonial) => (
            <Card
              key={testimonial.id}
              className="hover:scale-105 transition-all duration-300 hover:shadow-lg glass"
            >
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <Avatar className="h-12 w-12 mr-4">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {testimonial.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-semibold text-lg">{testimonial.name}</h4>
                    <p className="text-sm text-muted-foreground">{testimonial.location}</p>
                  </div>
                </div>

                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, index) => (
                    <Star
                      key={index}
                      className="h-4 w-4 text-yellow-400 fill-current"
                    />
                  ))}
                </div>

                <blockquote className="text-muted-foreground leading-relaxed">
                  "{testimonial.text}"
                </blockquote>
              </CardContent>
            </Card>
            ))
          )}
        </div>

        <div className="text-center mt-12">
          <div className="inline-flex items-center gap-2 text-lg font-semibold">
            <div className="flex">
              {[...Array(5)].map((_, index) => (
                <Star
                  key={index}
                  className="h-5 w-5 text-yellow-400 fill-current"
                />
              ))}
            </div>
            <span>{summary?.rating || 4.9}/5 מתוך {summary?.total_reviews || 2500}+ ביקורות</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;