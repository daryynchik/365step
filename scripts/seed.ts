/**
 * Creates the demo account and its friends if they are not there yet.
 * The schema itself is applied automatically on first connection.
 *
 *   npm run db:seed
 *   DATABASE_URL=postgres://… npm run db:seed
 */

import { DEMO_EMAIL, DEMO_PASSWORD, ensureDemo } from "../src/lib/demo";

async function main(): Promise<void> {
  await ensureDemo();
  console.log(`Demo account ready: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
