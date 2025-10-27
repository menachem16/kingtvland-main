-- Add foreign key constraint for chat_rooms.user_id to profiles
ALTER TABLE public.chat_rooms
ADD CONSTRAINT chat_rooms_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;