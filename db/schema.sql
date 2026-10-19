-- Blood SOS database schema. Safe to run more than once.

-- Hospitals / blood banks. Only these accounts can raise an SOS, which stops
-- fake requests. They are created by an admin (see scripts/seed.mjs).
CREATE TABLE IF NOT EXISTS hospitals (
  id            SERIAL PRIMARY KEY,
  name          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  phone         TEXT NOT NULL,
  address       TEXT NOT NULL,
  latitude      DOUBLE PRECISION NOT NULL,
  longitude     DOUBLE PRECISION NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Registered donors. They log in with email/phone + password, or with a
-- one-time magic link if they forget the password.
CREATE TABLE IF NOT EXISTS donors (
  id                 SERIAL PRIMARY KEY,
  name               TEXT NOT NULL,
  email              TEXT NOT NULL UNIQUE,
  phone              TEXT NOT NULL UNIQUE,
  password_hash      TEXT NOT NULL,
  blood_type         TEXT NOT NULL CHECK (blood_type IN ('A+','A-','B+','B-','AB+','AB-','O+','O-')),
  latitude           DOUBLE PRECISION NOT NULL,
  longitude          DOUBLE PRECISION NOT NULL,
  location_label     TEXT NOT NULL,
  last_donation_date DATE,
  is_available       BOOLEAN NOT NULL DEFAULT true,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- One-time magic sign-in links for donors ("forgot password").
CREATE TABLE IF NOT EXISTS login_tokens (
  token      TEXT PRIMARY KEY,
  donor_id   INT NOT NULL REFERENCES donors(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at    TIMESTAMPTZ
);

-- Logged-in browser sessions (both donors and hospitals).
CREATE TABLE IF NOT EXISTS sessions (
  token      TEXT PRIMARY KEY,
  role       TEXT NOT NULL CHECK (role IN ('donor','hospital')),
  user_id    INT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL
);

-- An SOS raised by a hospital.
CREATE TABLE IF NOT EXISTS blood_requests (
  id                 SERIAL PRIMARY KEY,
  hospital_id        INT NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  patient_blood_type TEXT NOT NULL CHECK (patient_blood_type IN ('A+','A-','B+','B-','AB+','AB-','O+','O-')),
  units_needed       INT NOT NULL CHECK (units_needed > 0),
  urgency            TEXT NOT NULL DEFAULT 'urgent' CHECK (urgency IN ('critical','urgent')),
  note               TEXT,
  radius_km          INT NOT NULL DEFAULT 10,
  status             TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','fulfilled','cancelled')),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  closed_at          TIMESTAMPTZ
);

-- Each donor alerted for a request, with their response. The token is the
-- magic link the donor taps to accept or decline.
CREATE TABLE IF NOT EXISTS alerts (
  id           SERIAL PRIMARY KEY,
  request_id   INT NOT NULL REFERENCES blood_requests(id) ON DELETE CASCADE,
  donor_id     INT NOT NULL REFERENCES donors(id) ON DELETE CASCADE,
  token        TEXT NOT NULL UNIQUE,
  distance_km  DOUBLE PRECISION NOT NULL,
  response     TEXT NOT NULL DEFAULT 'pending' CHECK (response IN ('pending','accepted','declined','donated')),
  sent_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  responded_at TIMESTAMPTZ,
  UNIQUE (request_id, donor_id)
);

-- Leftover from the old /outbox page; no longer used.
DROP TABLE IF EXISTS messages;
