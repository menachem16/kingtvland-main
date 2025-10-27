-- Add email column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN email TEXT UNIQUE;

-- Create index for faster email lookups
CREATE INDEX idx_profiles_email ON public.profiles(email);

-- Update existing profiles that have email stored in phone field
-- This is a one-time migration to fix the temporary solution
COMMENT ON COLUMN public.profiles.email IS 'User email address for authentication and communication';