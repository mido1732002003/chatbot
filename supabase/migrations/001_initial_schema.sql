
-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL CHECK (username = lower(username)),
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create conversations table with automatic pair_key generation
CREATE TABLE conversations (
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

-- Create messages table
CREATE TABLE messages (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES auth.users(id),
    body TEXT NOT NULL CHECK (length(body) > 0 AND length(body) <= 2000),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_messages_conversation_created ON messages(conversation_id, created_at DESC);
CREATE INDEX idx_conversations_member_one ON conversations(member_one);
CREATE INDEX idx_conversations_member_two ON conversations(member_two);
CREATE INDEX idx_profiles_username ON profiles(username);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles table
-- All authenticated users can view all profiles
CREATE POLICY "Profiles are viewable by authenticated users" 
    ON profiles FOR SELECT 
    USING (auth.role() = 'authenticated');

-- Users can update only their own profile
CREATE POLICY "Users can update own profile" 
    ON profiles FOR UPDATE 
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile" 
    ON profiles FOR INSERT 
    WITH CHECK (auth.uid() = id);

-- RLS Policies for conversations table
-- Users can view conversations where they are a member
CREATE POLICY "Users can view their conversations" 
    ON conversations FOR SELECT 
    USING (
        auth.uid() = member_one OR 
        auth.uid() = member_two
    );

-- Users can create conversations (member_one must be the user, member_two must be different)
CREATE POLICY "Users can create conversations" 
    ON conversations FOR INSERT 
    WITH CHECK (
        auth.uid() = member_one AND 
        member_two != auth.uid()
    );

-- RLS Policies for messages table
-- Users can view messages only from conversations they're part of
CREATE POLICY "Users can view messages from their conversations" 
    ON messages FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM conversations 
            WHERE conversations.id = messages.conversation_id 
            AND (conversations.member_one = auth.uid() OR conversations.member_two = auth.uid())
        )
    );

-- Users can insert messages only if they're the sender and part of the conversation
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

-- Create trigger function to auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user() 
RETURNS TRIGGER AS $$
DECLARE
    random_username TEXT;
BEGIN
    -- Generate a temporary username based on email or a random string
    random_username := LOWER(
        COALESCE(
            SPLIT_PART(NEW.email, '@', 1),
            'user_' || substr(md5(random()::text), 1, 8)
        )
    );
    
    -- Ensure username is unique by appending numbers if necessary
    WHILE EXISTS (SELECT 1 FROM profiles WHERE username = random_username) LOOP
        random_username := random_username || floor(random() * 1000)::text;
    END LOOP;
    
    INSERT INTO profiles (id, username, full_name)
    VALUES (
        NEW.id,
        random_username,
        COALESCE(NEW.raw_user_meta_data->>'full_name', '')
    );
    RETURN NEW;
EXCEPTION
    WHEN unique_violation THEN
        -- If username already exists, append timestamp
        INSERT INTO profiles (id, username, full_name)
        VALUES (
            NEW.id,
            random_username || '_' || extract(epoch from now())::text,
            COALESCE(NEW.raw_user_meta_data->>'full_name', '')
        );
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for auto-profile creation
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- Enable Realtime for messages table
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;