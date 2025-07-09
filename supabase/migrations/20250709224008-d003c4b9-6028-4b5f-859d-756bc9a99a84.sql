-- Add email confirmation tracking to profiles table
ALTER TABLE public.profiles 
ADD COLUMN email_confirmed BOOLEAN DEFAULT FALSE,
ADD COLUMN email_confirmation_sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN email_confirmation_token UUID DEFAULT gen_random_uuid();

-- Update existing users to be confirmed (they're already in the system)
UPDATE public.profiles 
SET email_confirmed = TRUE 
WHERE email_confirmed IS NULL OR email_confirmed = FALSE;

-- Create index for faster lookups
CREATE INDEX idx_profiles_email_confirmation_token ON public.profiles(email_confirmation_token);
CREATE INDEX idx_profiles_email_confirmed ON public.profiles(email_confirmed);