DO $$
DECLARE
  r record;
  new_qual text;
  new_check text;
  sql text;
BEGIN
  FOR r IN
    SELECT schemaname, tablename, policyname, qual, with_check
    FROM pg_policies
    WHERE schemaname = 'public'
      AND (
        coalesce(qual, '') ~ 'auth\\.uid\\(\\)|auth\\.role\\(\\)|auth\\.jwt\\(\\)|current_setting\\('
        OR coalesce(with_check, '') ~ 'auth\\.uid\\(\\)|auth\\.role\\(\\)|auth\\.jwt\\(\\)|current_setting\\('
      )
  LOOP
    new_qual := r.qual;
    new_check := r.with_check;

    IF new_qual IS NOT NULL THEN
      IF new_qual ILIKE '%auth.uid()%' AND new_qual NOT ILIKE '%select auth.uid()%' THEN
        new_qual := regexp_replace(new_qual, 'auth\\.uid\\(\\)', '(select auth.uid())', 'g');
      END IF;
      IF new_qual ILIKE '%auth.role()%' AND new_qual NOT ILIKE '%select auth.role()%' THEN
        new_qual := regexp_replace(new_qual, 'auth\\.role\\(\\)', '(select auth.role())', 'g');
      END IF;
      IF new_qual ILIKE '%auth.jwt()%' AND new_qual NOT ILIKE '%select auth.jwt()%' THEN
        new_qual := regexp_replace(new_qual, 'auth\\.jwt\\(\\)', '(select auth.jwt())', 'g');
      END IF;
      IF new_qual ILIKE '%current_setting(%' AND new_qual NOT ILIKE '%select current_setting(%' THEN
        new_qual := regexp_replace(new_qual, 'current_setting\\(([^)]*)\\)', '(select current_setting(\\1))', 'g');
      END IF;
    END IF;

    IF new_check IS NOT NULL THEN
      IF new_check ILIKE '%auth.uid()%' AND new_check NOT ILIKE '%select auth.uid()%' THEN
        new_check := regexp_replace(new_check, 'auth\\.uid\\(\\)', '(select auth.uid())', 'g');
      END IF;
      IF new_check ILIKE '%auth.role()%' AND new_check NOT ILIKE '%select auth.role()%' THEN
        new_check := regexp_replace(new_check, 'auth\\.role\\(\\)', '(select auth.role())', 'g');
      END IF;
      IF new_check ILIKE '%auth.jwt()%' AND new_check NOT ILIKE '%select auth.jwt()%' THEN
        new_check := regexp_replace(new_check, 'auth\\.jwt\\(\\)', '(select auth.jwt())', 'g');
      END IF;
      IF new_check ILIKE '%current_setting(%' AND new_check NOT ILIKE '%select current_setting(%' THEN
        new_check := regexp_replace(new_check, 'current_setting\\(([^)]*)\\)', '(select current_setting(\\1))', 'g');
      END IF;
    END IF;

    IF new_qual IS DISTINCT FROM r.qual OR new_check IS DISTINCT FROM r.with_check THEN
      sql := format('ALTER POLICY %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
      IF new_qual IS NOT NULL THEN
        sql := sql || format(' USING (%s)', new_qual);
      END IF;
      IF new_check IS NOT NULL THEN
        sql := sql || format(' WITH CHECK (%s)', new_check);
      END IF;
      EXECUTE sql;
    END IF;
  END LOOP;
END $$;

ALTER POLICY "Service role full access to preferences" ON public.user_preferences TO service_role;
ALTER POLICY "Service role can manage notifications" ON public.notifications TO service_role;
ALTER POLICY "Service role can manage digests" ON public.digests TO service_role;

DROP POLICY IF EXISTS user_preferences_all ON public.user_preferences;
DROP POLICY IF EXISTS digests_select ON public.digests;
DROP POLICY IF EXISTS digests_insert ON public.digests;
DROP POLICY IF EXISTS digests_update ON public.digests;
DROP POLICY IF EXISTS notifications_select ON public.notifications;
DROP POLICY IF EXISTS notifications_insert ON public.notifications;
DROP POLICY IF EXISTS notifications_update ON public.notifications;
DROP POLICY IF EXISTS notifications_delete ON public.notifications;

DROP POLICY IF EXISTS "Users can read public universes" ON public.universes;
DROP POLICY IF EXISTS "Users can read their own universes" ON public.universes;

DROP POLICY IF EXISTS "Project owners can manage collaborators" ON public.project_collaborators;
CREATE POLICY "Project owners can insert collaborators" ON public.project_collaborators
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE id = project_collaborators.project_id
      AND owner_id = (select auth.uid())
    )
  );
CREATE POLICY "Project owners can update collaborators" ON public.project_collaborators
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE id = project_collaborators.project_id
      AND owner_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE id = project_collaborators.project_id
      AND owner_id = (select auth.uid())
    )
  );
CREATE POLICY "Project owners can delete collaborators" ON public.project_collaborators
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE id = project_collaborators.project_id
      AND owner_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can manage own taggings" ON public.taggings;
CREATE POLICY "Users can insert own taggings" ON public.taggings
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tags
      WHERE id = taggings.tag_id
      AND owner_id = (select auth.uid())
    )
  );
CREATE POLICY "Users can update own taggings" ON public.taggings
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.tags
      WHERE id = taggings.tag_id
      AND owner_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tags
      WHERE id = taggings.tag_id
      AND owner_id = (select auth.uid())
    )
  );
CREATE POLICY "Users can delete own taggings" ON public.taggings
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.tags
      WHERE id = taggings.tag_id
      AND owner_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can manage own cross references" ON public.cross_references;
CREATE POLICY "Users can insert own cross references" ON public.cross_references
  FOR INSERT WITH CHECK (created_by = (select auth.uid()));
CREATE POLICY "Users can update own cross references" ON public.cross_references
  FOR UPDATE USING (created_by = (select auth.uid()))
  WITH CHECK (created_by = (select auth.uid()));
CREATE POLICY "Users can delete own cross references" ON public.cross_references
  FOR DELETE USING (created_by = (select auth.uid()));

DROP POLICY IF EXISTS "Users can delete own preferences" ON public.user_preferences;
CREATE POLICY "Users can delete own preferences" ON public.user_preferences
  FOR DELETE USING (user_id = (select auth.uid()));
