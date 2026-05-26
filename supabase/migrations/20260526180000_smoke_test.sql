-- Smoke test table — підтвердження, що ланцюжок Supabase ↔ HOSTIQ ↔
-- GitHub Actions працює end-to-end. Після успішного запуску цю
-- міграцію та supabase/migrations/*/smoke_test.sql прибрати окремим PR
-- (разом зі smoke.html).

CREATE TABLE smoke_test (
  id BIGSERIAL PRIMARY KEY,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE smoke_test ENABLE ROW LEVEL SECURITY;

CREATE POLICY "smoke_test_public_read"
  ON smoke_test FOR SELECT
  USING (true);

INSERT INTO smoke_test (message) VALUES
  ('🎉 Все працює! Supabase + HOSTIQ + GitHub Actions');
