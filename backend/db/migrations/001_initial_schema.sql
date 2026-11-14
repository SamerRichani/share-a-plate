CREATE TABLE users (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL CHECK (btrim(name) <> ''),
  email TEXT NOT NULL UNIQUE CHECK (email = lower(btrim(email)) AND email <> ''),
  password_hash TEXT NOT NULL CHECK (password_hash <> ''),
  role TEXT NOT NULL CHECK (role IN ('donor', 'recipient', 'administrator')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE offers (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  donor_id INTEGER NOT NULL REFERENCES users(id),
  title TEXT NOT NULL CHECK (btrim(title) <> ''),
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL CHECK (category = lower(btrim(category)) AND category <> ''),
  area TEXT NOT NULL CHECK (area = lower(btrim(area)) AND area <> ''),
  location TEXT NOT NULL CHECK (btrim(location) <> ''),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  remaining_quantity INTEGER NOT NULL CHECK (remaining_quantity BETWEEN 0 AND quantity),
  pickup_start TIMESTAMPTZ NOT NULL,
  pickup_deadline TIMESTAMPTZ NOT NULL CHECK (pickup_deadline > pickup_start),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed', 'removed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE reservations (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  offer_id INTEGER NOT NULL REFERENCES offers(id),
  recipient_id INTEGER NOT NULL REFERENCES users(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  pickup_code TEXT NOT NULL UNIQUE CHECK (btrim(pickup_code) <> ''),
  status TEXT NOT NULL DEFAULT 'reserved'
    CHECK (status IN ('reserved', 'collected', 'cancelled', 'expired')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE reports (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  reporter_id INTEGER NOT NULL REFERENCES users(id),
  offer_id INTEGER NOT NULL REFERENCES offers(id),
  reason TEXT NOT NULL CHECK (btrim(reason) <> ''),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'dismissed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX offers_donor_idx ON offers (donor_id);
CREATE INDEX offers_discovery_idx ON offers (area, category, pickup_deadline)
  WHERE status = 'active';
CREATE INDEX reservations_offer_idx ON reservations (offer_id);
CREATE INDEX reservations_recipient_idx ON reservations (recipient_id);
CREATE UNIQUE INDEX reservations_one_active_idx ON reservations (offer_id, recipient_id)
  WHERE status = 'reserved';
CREATE INDEX reports_offer_idx ON reports (offer_id);
CREATE INDEX reports_reporter_idx ON reports (reporter_id);
