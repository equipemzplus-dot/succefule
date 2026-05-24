-- =========================================================================
-- SQL SCRIPT: MZ+ DEEP ANALYTICS INFRASTRUCTURE
-- =========================================================================
-- This script creates the core telemetry and tracking tables necessary 
-- for the "Analyse Approfondie" module of the new MZ+ Admin Panel.
-- It focuses on behavioural analytics, time tracking, conversion origins,
-- and AI interaction logs.
-- =========================================================================

-- 1. TELEMETRY: PAGE VIEWS & SESSIONS (Analyse Comportementale & Engagement)
CREATE TABLE IF NOT EXISTS analytics_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    session_start TIMESTAMPTZ DEFAULT NOW(),
    session_end TIMESTAMPTZ,
    device_type TEXT,
    country TEXT,
    city TEXT,
    is_bounced BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS analytics_page_views (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES analytics_sessions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    page_path TEXT NOT NULL,
    time_spent_seconds INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. CLICK & HEATMAP TRACKING (Analyse Comportementale)
CREATE TABLE IF NOT EXISTS analytics_interactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    page_path TEXT NOT NULL,
    element_id TEXT NOT NULL,
    action_type TEXT NOT NULL, -- e.g., 'click', 'hover', 'scroll'
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. PREMIUM CONVERSION FUNNEL (Analyse Premium & Revenus)
CREATE TABLE IF NOT EXISTS analytics_premium_funnel (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    origin_trigger TEXT NOT NULL, -- e.g., 'flash_offer', 'axis_ia', 'challenge_j3'
    visited_page BOOLEAN DEFAULT TRUE,
    initiated_checkout BOOLEAN DEFAULT FALSE,
    completed_purchase BOOLEAN DEFAULT FALSE,
    dropoff_stage TEXT, -- e.g., 'payment_method_selection', '3d_secure'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. CHALLENGE PROGRESSION TRACKING (Analyse Défis)
-- Track granular actions rather than just state (which mz_challenge_3j_state already does)
CREATE TABLE IF NOT EXISTS analytics_challenge_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    challenge_day INT NOT NULL,
    event_type TEXT NOT NULL, -- e.g., 'started', 'video_watched', 'aborted', 'completed'
    time_spent_seconds INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. AI INTERACTION QUALITY (Analyse Axis IA)
CREATE TABLE IF NOT EXISTS analytics_axis_interactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    intent_category TEXT,
    user_satisfaction_score INT, -- 1 to 5
    frustration_detected BOOLEAN DEFAULT FALSE,
    escalated_to_human BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. ISSUE & ERROR TRACKING (Détection des problèmes)
CREATE TABLE IF NOT EXISTS analytics_system_errors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    error_type TEXT NOT NULL, -- e.g., 'api_timeout', 'ui_crash', 'payment_failed'
    path TEXT,
    error_message TEXT,
    metadata JSONB DEFAULT '{}',
    is_resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================================
-- OPTIONAL: INDEXES FOR PERFORMANCE
-- =========================================================================
CREATE INDEX idx_analytics_sessions_start ON analytics_sessions(session_start);
CREATE INDEX idx_analytics_page_views_path ON analytics_page_views(page_path);
CREATE INDEX idx_analytics_premium_funnel_origin ON analytics_premium_funnel(origin_trigger);
CREATE INDEX idx_analytics_errors_unresolved ON analytics_system_errors(is_resolved) WHERE is_resolved = FALSE;
