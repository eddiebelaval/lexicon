-- Enable RLS on telegram_registration_codes (missed in initial migration)
ALTER TABLE telegram_registration_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "telegram_reg_read_all"
  ON telegram_registration_codes FOR SELECT
  USING (true);

CREATE POLICY "telegram_reg_insert_service"
  ON telegram_registration_codes FOR INSERT
  WITH CHECK (true);

CREATE POLICY "telegram_reg_update_service"
  ON telegram_registration_codes FOR UPDATE
  USING (true);
