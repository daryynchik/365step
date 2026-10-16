/** Prints the schema, e.g. to paste into the Supabase SQL editor: npm run -s db:schema */

import { SCHEMA } from "../src/lib/db/schema";

process.stdout.write(SCHEMA.trim() + "\n");
