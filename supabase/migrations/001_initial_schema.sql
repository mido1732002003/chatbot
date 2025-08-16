
-- Drop existing objects if they exist (for clean setup)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table (if not exists)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL CHECK (username = lower(username)),
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create conversations table (if not exists)
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_one UUID NOT NULL REFERENCES auth.users(id),
    member_two UUID NOT NULL REFERENCES auth.users(id),
    pair_key TEXT GENERATED ALWAYS AS (
        CASE 
            WHEN member_one < member_two THEN member_one::TEXT || ':' || member_two::TEXT
            ELSE member_two::TEXT || ':' || member_one::TEXT
        END
    ) STORED UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT different_members CHECK (member_one != member_two)
);

-- Create messages table (if not exists)
CREATE TABLE IF NOT EXISTS messages (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES auth.users(id),
    body TEXT NOT NULL CHECK (length(body) > 0 AND length(body) <= 2000),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created ON messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_member_one ON conversations(member_one);
CREATE INDEX IF NOT EXISTS idx_conversations_member_two ON conversations(member_two);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view their conversations" ON conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON conversations;
DROP POLICY IF EXISTS "Users can view messages from their conversations" ON messages;
DROP POLICY IF EXISTS "Users can send messages to their conversations" ON messages;

-- RLS Policies for profiles table
CREATE POLICY "Profiles are viewable by authenticated users" 
    ON profiles FOR SELECT 
    USING (true);  -- Allow all authenticated users to see profiles

CREATE POLICY "Users can update own profile" 
    ON profiles FOR UPDATE 
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile" 
    ON profiles FOR INSERT 
    WITH CHECK (auth.uid() = id);

-- RLS Policies for conversations table
CREATE POLICY "Users can view their conversations" 
    ON conversations FOR SELECT 
    USING (
        auth.uid() = member_one OR 
        auth.uid() = member_two
    );

CREATE POLICY "Users can create conversations" 
    ON conversations FOR INSERT 
    WITH CHECK (
        auth.uid() = member_one AND 
        member_two != auth.uid()
    );

-- RLS Policies for messages table
CREATE POLICY "Users can view messages from their conversations" 
    ON messages FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM conversations 
            WHERE conversations.id = messages.conversation_id 
            AND (conversations.member_one = auth.uid() OR conversations.member_two = auth.uid())
        )
    );

CREATE POLICY "Users can send messages to their conversations" 
    ON messages FOR INSERT 
    WITH CHECK (
        sender_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM conversations 
            WHERE conversations.id = messages.conversation_id 
            AND (conversations.member_one = auth.uid() OR conversations.member_two = auth.uid())
        )
    );

-- FIXED: Create trigger function with better error handling
CREATE OR REPLACE FUNCTION handle_new_user() 
RETURNS TRIGGER 
SECURITY DEFINER 
SET search_path = public
AS $$
DECLARE
    random_username TEXT;
    base_username TEXT;
    counter INT := 0;
BEGIN
    -- Extract base username from email or generate random
    base_username := LOWER(
        COALESCE(
            SPLIT_PART(NEW.email, '@', 1),
            'user'
        )
    );
    
    -- Remove any special characters except underscores
    base_username := regexp_replace(base_username, '[^a-z0-9_]', '', 'g');
    
    -- Ensure minimum length
    IF length(base_username) < 3 THEN
        base_username := 'user';
    END IF;
    
    -- Truncate if too long
    IF length(base_username) > 15 THEN
        base_username := substring(base_username from 1 for 15);
    END IF;
    
    random_username := base_username;
    
    -- Keep trying until we find a unique username
    LOOP
        BEGIN
            -- Try to insert with current username
            INSERT INTO public.profiles (id, username, full_name)
            VALUES (
                NEW.id,
                random_username,
                COALESCE(NEW.raw_user_meta_data->>'full_name', '')
            );
            
            -- If successful, exit loop
            EXIT;
            
        EXCEPTION
            WHEN unique_violation THEN
                -- Username taken, try another
                counter := counter + 1;
                random_username := base_username || '_' || counter;
                
                -- Safety check to prevent infinite loop
                IF counter > 1000 THEN
                    random_username := base_username || '_' || extract(epoch from now())::text;
                    EXIT;
                END IF;
        END;
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-profile creation
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE messages;