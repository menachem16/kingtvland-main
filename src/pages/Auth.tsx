import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { signUpSchema, signInSchema, type SignUpInput, type SignInInput } from '@/lib/validations';

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const signInForm = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const signUpForm = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: '',
      password: '',
      firstName: '',
      lastName: '',
    },
  });

  const handleSignIn = async (data: SignInInput) => {
    setIsLoading(true);

    const { error } = await signIn(data.email, data.password);

    if (error) {
      toast({
        title: 'שגיאה בהתחברות',
        description: /Invalid email or password/i.test(error.message)
          ? 'פרטי ההתחברות שגויים'
          : 'אירעה שגיאה בהתחברות',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'התחברת בהצלחה',
        description: 'ברוך הבא למערכת',
      });
      navigate('/');
    }

    setIsLoading(false);
  };

  const handleSignUp = async (data: SignUpInput) => {
    setIsLoading(true);

    const { error } = await signUp(
      data.email,
      data.password,
      data.firstName,
      data.lastName
    );

    if (error) {
      toast({
        title: 'שגיאה ברישום',
        description: error.message === 'User already registered' 
          ? 'המשתמש כבר רשום במערכת' 
          : 'אירעה שגיאה ברישום',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'נרשמת בהצלחה',
        description: 'ברוך הבא למערכת',
      });
      navigate('/');
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">ברוכים הבאים</CardTitle>
          <CardDescription>
            התחברו או הירשמו לפלטפורמת הצמיחה
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">התחברות</TabsTrigger>
              <TabsTrigger value="signup">הרשמה</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={signInForm.handleSubmit(handleSignIn)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">כתובת מייל</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder="הזן כתובת מייל"
                    {...signInForm.register('email')}
                    disabled={isLoading}
                  />
                  {signInForm.formState.errors.email && (
                    <p className="text-sm text-destructive">{signInForm.formState.errors.email.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">סיסמה</Label>
                  <Input
                    id="signin-password"
                    type="password"
                    placeholder="הזן סיסמה"
                    {...signInForm.register('password')}
                    disabled={isLoading}
                  />
                  {signInForm.formState.errors.password && (
                    <p className="text-sm text-destructive">{signInForm.formState.errors.password.message}</p>
                  )}
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'מתחבר...' : 'התחבר'}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={signUpForm.handleSubmit(handleSignUp)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">שם פרטי</Label>
                    <Input
                      id="firstName"
                      type="text"
                      placeholder="שם פרטי"
                      {...signUpForm.register('firstName')}
                      disabled={isLoading}
                    />
                    {signUpForm.formState.errors.firstName && (
                      <p className="text-sm text-destructive">{signUpForm.formState.errors.firstName.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">שם משפחה</Label>
                    <Input
                      id="lastName"
                      type="text"
                      placeholder="שם משפחה"
                      {...signUpForm.register('lastName')}
                      disabled={isLoading}
                    />
                    {signUpForm.formState.errors.lastName && (
                      <p className="text-sm text-destructive">{signUpForm.formState.errors.lastName.message}</p>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">כתובת מייל</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="הזן כתובת מייל"
                    {...signUpForm.register('email')}
                    disabled={isLoading}
                  />
                  {signUpForm.formState.errors.email && (
                    <p className="text-sm text-destructive">{signUpForm.formState.errors.email.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">סיסמה</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="לפחות 8 תווים, אות גדולה, אות קטנה וספרה"
                    {...signUpForm.register('password')}
                    disabled={isLoading}
                  />
                  {signUpForm.formState.errors.password && (
                    <p className="text-sm text-destructive">{signUpForm.formState.errors.password.message}</p>
                  )}
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'נרשם...' : 'הירשם'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;