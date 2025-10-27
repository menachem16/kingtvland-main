import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { googleSheets } from '@/integrations/google-sheets/client';
import { User, Mail, Phone, Edit, Save, X } from 'lucide-react';
import { profileSchema, type ProfileInput } from '@/lib/validations';
import { useQueryClient } from '@tanstack/react-query';

const Profile = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  const form = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: profile?.first_name || '',
      lastName: profile?.last_name || '',
      phone: profile?.phone || '',
    },
  });

  useEffect(() => {
    if (profile) {
      form.reset({
        firstName: profile.first_name || '',
        lastName: profile.last_name || '',
        phone: profile.phone || '',
      });
    }
  }, [profile, form]);

  const getUserInitials = () => {
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name[0]}${profile.last_name[0]}`;
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return 'U';
  };

  const handleSave = async (data: ProfileInput) => {
    if (!user) return;

    setLoading(true);
    try {
      const result = await googleSheets.updateProfile(user.id, {
        first_name: data.firstName,
        last_name: data.lastName,
        phone: data.phone || null,
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      toast({
        title: "הפרופיל עודכן בהצלחה",
        description: "הפרטים האישיים שלך נשמרו",
      });
      setIsEditing(false);
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "שגיאה בעדכון הפרופיל",
        description: "אירעה שגיאה בעת שמירת הפרטים",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.reset({
      firstName: profile?.first_name || '',
      lastName: profile?.last_name || '',
      phone: profile?.phone || '',
    });
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/20">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-primary bg-clip-text text-transparent">
            הפרופיל שלי
          </h1>
          <p className="text-muted-foreground text-lg">
            נהל את הפרטים האישיים שלך
          </p>
        </div>

        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-subtle opacity-50" />
          <CardHeader className="relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="text-xl">{getUserInitials()}</AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-2xl">פרטים אישיים</CardTitle>
                  <CardDescription>
                    עדכן את הפרטים האישיים שלך
                  </CardDescription>
                </div>
              </div>
              {!isEditing && (
                <Button 
                  variant="outline" 
                  onClick={() => setIsEditing(true)}
                  className="gap-2"
                >
                  <Edit className="h-4 w-4" />
                  ערוך
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="relative space-y-6">
            <form onSubmit={form.handleSubmit(handleSave)} className="space-y-6">
              {/* Email (Read-only) */}
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  כתובת אימייל
                </Label>
                <Input
                  id="email"
                  value={user?.email || ''}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  לא ניתן לשנות את כתובת האימייל
                </p>
              </div>

              {/* First Name */}
              <div className="space-y-2">
                <Label htmlFor="firstName" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  שם פרטי
                </Label>
                <Input
                  id="firstName"
                  {...form.register('firstName')}
                  disabled={!isEditing}
                  placeholder="הכנס שם פרטי"
                />
                {form.formState.errors.firstName && (
                  <p className="text-sm text-destructive">{form.formState.errors.firstName.message}</p>
                )}
              </div>

              {/* Last Name */}
              <div className="space-y-2">
                <Label htmlFor="lastName" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  שם משפחה
                </Label>
                <Input
                  id="lastName"
                  {...form.register('lastName')}
                  disabled={!isEditing}
                  placeholder="הכנס שם משפחה"
                />
                {form.formState.errors.lastName && (
                  <p className="text-sm text-destructive">{form.formState.errors.lastName.message}</p>
                )}
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  מספר טלפון
                </Label>
                <Input
                  id="phone"
                  {...form.register('phone')}
                  disabled={!isEditing}
                  placeholder="050-1234567"
                  dir="ltr"
                />
                {form.formState.errors.phone && (
                  <p className="text-sm text-destructive">{form.formState.errors.phone.message}</p>
                )}
              </div>

              {/* Action Buttons */}
              {isEditing && (
                <div className="flex gap-3 pt-4">
                  <Button 
                    type="submit"
                    disabled={loading}
                    className="gap-2 flex-1"
                  >
                    <Save className="h-4 w-4" />
                    {loading ? 'שומר...' : 'שמור שינויים'}
                  </Button>
                  <Button 
                    type="button"
                    variant="outline" 
                    onClick={handleCancel}
                    disabled={loading}
                    className="gap-2"
                  >
                    <X className="h-4 w-4" />
                    ביטול
                  </Button>
                </div>
              )}
            </form>
          </CardContent>
        </Card>

        {/* Account Info */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>פרטי חשבון</CardTitle>
            <CardDescription>
              מידע נוסף על החשבון שלך
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  סוג משתמש
                </Label>
                <p className="text-sm">
                  {profile?.is_admin ? 'מנהל מערכת' : 'משתמש רגיל'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
