CREATE TABLE IF NOT EXISTS public.platform_settings (
    id TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read platform_settings" ON public.platform_settings;
CREATE POLICY "Public read platform_settings" ON public.platform_settings FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin write platform_settings" ON public.platform_settings;
CREATE POLICY "Admin write platform_settings" ON public.platform_settings FOR ALL USING (true);

INSERT INTO public.platform_settings (id, value) VALUES ('store_customization', '{"enabled": true}'::jsonb) ON CONFLICT (id) DO NOTHING;

NOTIFY pgrst, 'reload schema';
