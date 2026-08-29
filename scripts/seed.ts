/**
 * One-time seeding of the recurring schedule, from the command line.
 *
 * The same import is available in the app under Settings > ייבוא לוז, which
 * needs no credentials at all: the security rules already let a signed-in
 * family member write these collections. This exists for the case where a
 * browser is not the convenient place to do it.
 *
 * Validation and id derivation are shared with the in-app import, so "valid"
 * means the same thing in both.
 *
 * Usage:
 *   npx tsx scripts/seed.ts --dry-run
 *   FIREBASE_SERVICE_ACCOUNT='{...}' npx tsx scripts/seed.ts --family <id>
 */

import { readFileSync } from 'node:fs';
import { cert, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

import { activityId, summarise, validate, type Seed } from '../src/app/core/schedule/seed-schedule';

const SEED_FILE = 'seed/schedule.json';

async function main(): Promise<void> {
  const familyId = argValue('--family');
  const dryRun = process.argv.includes('--dry-run');

  const seed = JSON.parse(readFileSync(SEED_FILE, 'utf8')) as Seed;

  const problems = validate(seed);
  if (problems.length) {
    console.error('Seed file is not ready:\n' + problems.map((p) => `  - ${p}`).join('\n'));
    process.exit(1);
  }

  console.log(summarise(seed).join('\n'));

  // A dry run only checks the file; a real write needs a family and credentials.
  if (dryRun) {
    console.log('\nDry run: nothing written.');
    return;
  }

  if (!familyId) throw new Error('Pass --family <familyId>');
  const raw = process.env['FIREBASE_SERVICE_ACCOUNT'];
  if (!raw) throw new Error('FIREBASE_SERVICE_ACCOUNT is not set');

  initializeApp({ credential: cert(JSON.parse(raw)) });
  const db = getFirestore();
  const base = db.collection('families').doc(familyId);
  if (!(await base.get()).exists) throw new Error(`No family ${familyId}`);

  const batch = db.batch();

  for (const child of seed.children) {
    batch.set(
      base.collection('children').doc(child.id),
      { name: child.name, color: child.color, order: child.order },
      { merge: true }
    );
  }

  for (const activity of seed.activities) {
    batch.set(
      base.collection('activities').doc(activityId(activity)),
      {
        childId: activity.childId,
        title: activity.title.trim(),
        ...(activity.location ? { location: activity.location.trim() } : {}),
        daysOfWeek: [...activity.daysOfWeek].sort((a, b) => a - b),
        startTime: activity.startTime,
        ...(activity.endTime ? { endTime: activity.endTime } : {}),
        ...(activity.departureTime ? { departureTime: activity.departureTime } : {}),
        drivers: Object.fromEntries(
          Object.entries(activity.drivers ?? {}).map(([day, id]) => [Number(day), id])
        ),
        prepItems: activity.prepItems ?? [],
      },
      { merge: true }
    );
  }

  await batch.commit();
  console.log(`\nWritten to families/${familyId}.`);
}

function argValue(flag: string): string | undefined {
  const index = process.argv.indexOf(flag);
  return index === -1 ? undefined : process.argv[index + 1];
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
