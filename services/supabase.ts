
import { createClient } from '@supabase/supabase-js';

// Use environment variables if available, otherwise fallback to hardcoded values
const RAW_URL = (typeof process !== 'undefined' ? process.env.VITE_SUPABASE_URL : import.meta.env?.VITE_SUPABASE_URL) || 'https://ydkicdhcylpdffuzgdvm.supabase.co';
// Sanitize URL: remove trailing slashes and common API suffixes that cause "Invalid path" errors
const SUPABASE_ANON_KEY = (typeof process !== 'undefined' ? process.env.VITE_SUPABASE_ANON_KEY : import.meta.env?.VITE_SUPABASE_ANON_KEY) || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlka2ljZGhjeWxwZGZmdXpnZHZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5ODI1OTgsImV4cCI6MjA4MTU1ODU5OH0.xR88w598DfeGilSgOBSdDYE1wFWfImllalXvHj0x6x0';
const SUPABASE_URL = RAW_URL.replace(/\/+$/, '').replace(/\/rest\/v1$/, '');

// Create a singleton client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
