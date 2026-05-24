CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS BOOLEAN AS $$
DECLARE
  is_adm BOOLEAN;
  adm_role TEXT;
BEGIN
  SELECT is_admin, admin_role INTO is_adm, adm_role FROM public.users WHERE id = auth.uid();
  RETURN is_adm = true OR adm_role IN ('super_admin', 'marketing_admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP POLICY IF EXISTS "Admins can update users" ON public.users;
CREATE POLICY "Admins can update users" ON public.users 
FOR UPDATE 
USING (
  id = auth.uid() OR public.is_current_user_admin()
);
