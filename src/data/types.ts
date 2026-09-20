export type SpotifyRow = {
  spotify_track_uri: string;
  ts: string;
  platform: string;
  ms_played: string;
  track_name: string;
  artist_name: string;
  album_name: string;
  reson_start: string;   // keep the exact header spelling from the CSV
  reason_end: string;
  shuffle: string;
  skipped: string;
};

export type HouseholdRow = {
  Date: string;
  Mode: string;
  Category: string;
  Subcategory: string;
  Note: string;
  Amount: string;
  "Income/Expense": string;
  Currency: string;
};

export type CardRow = {
  trans_id: string;
  trans_date_trans_time: string;
  cc_num: string;
  merchant: string;
  category: string;
  amt: string;
  first: string;
  last: string;
  gender: string;
  street: string;
  city: string;
  state: string;
  lat: string;
  long: string;
  city_pop: string;
  job: string;
  dob: string;
  merch_lat: string;
  merch_long: string;
  is_fraud: string;
  customer_id: string;
};

// Unified event model for cross-dataset connections
export type FolioEventSource = "spotify" | "household" | "card";

export type FolioEvent = {
  id: string;
  source: FolioEventSource;
  at: Date;

  // for UI display/search
  title: string;
  detail?: string;

  // optional structured fields
  category?: string;
  amount?: number;
  location?: string;
  tags?: string[];
};