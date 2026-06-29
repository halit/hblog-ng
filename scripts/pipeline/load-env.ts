// Standalone build scripts run through plain `dotenv`, which only reads `.env`.
// Next.js loads `.env.local` automatically, but these `tsx` scripts do not, so
// any override set there (e.g. NEXT_PUBLIC_PGP_*) would be invisible. Load both
// here, with `.env.local` taking precedence, to mirror Next.js behavior.
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local', override: true });
