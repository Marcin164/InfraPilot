/**
 * One-time migration: re-encrypts any secret still stored in the legacy
 * unauthenticated AES-256-CBC format (see helpers/crypto.ts) to the new
 * authenticated AES-256-GCM format. Safe to re-run — skips anything
 * already in `gcm:` format. For each field: decrypt with the old scheme,
 * re-encrypt with the new one, verify the round trip decrypts back to the
 * exact same plaintext before writing, then save.
 *
 * Run with: npm run reencrypt-secrets
 */
import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AdminSettings } from './entities/adminSettings.entity';
import { NetworkDeviceCredential } from './entities/networkDeviceCredential.entity';
import { encrypt, decrypt } from './helpers/crypto';

function needsMigration(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 && !value.startsWith('gcm:');
}

// Re-encrypts one field in place, verifying the round trip before returning
// the new value. Returns null if the field didn't need migrating. Does NOT
// throw on a decrypt failure (a value encrypted under a since-rotated key
// can't be recovered by this script either) — logs a warning and leaves
// that field untouched so the rest of the migration can still proceed.
function migrateField(label: string, oldValue: unknown): string | null {
  if (!needsMigration(oldValue)) return null;
  let plaintext: string;
  try {
    plaintext = decrypt(oldValue);
  } catch (err) {
    console.warn(
      `SKIPPED ${label}: cannot decrypt with the current ENCRYPTION_KEY (${(err as Error).message}). ` +
        `This value was likely encrypted under a different key at some point — it needs to be re-entered ` +
        `through its admin UI, this script can't recover or migrate it.`,
    );
    return null;
  }
  const reEncrypted = encrypt(plaintext);
  const verify = decrypt(reEncrypted);
  if (verify !== plaintext) {
    throw new Error(`${label}: re-encrypted value failed round-trip verification — aborting`);
  }
  return reEncrypted;
}

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: false });
  const adminRepo = app.get(getRepositoryToken(AdminSettings));
  const credRepo = app.get(getRepositoryToken(NetworkDeviceCredential));

  let migrated = 0;

  // AD bind password
  const adConfig = await adminRepo.findOne({ where: { key: 'ad_config' } });
  if (adConfig) {
    const next = migrateField('ad_config.password', adConfig.value?.password);
    if (next) {
      adConfig.value = { ...adConfig.value, password: next };
      await adminRepo.save(adConfig);
      console.log('MIGRATED ad_config.password');
      migrated++;
    }
  }

  // SMTP password
  const smtpConfig = await adminRepo.findOne({ where: { key: 'smtp_config' } });
  if (smtpConfig) {
    const next = migrateField('smtp_config.pass', smtpConfig.value?.pass);
    if (next) {
      smtpConfig.value = { ...smtpConfig.value, pass: next };
      await adminRepo.save(smtpConfig);
      console.log('MIGRATED smtp_config.pass');
      migrated++;
    }
  }

  // M365 client secret
  const m365Config = await adminRepo.findOne({ where: { key: 'm365_config' } });
  if (m365Config) {
    const next = migrateField('m365_config.clientSecret', m365Config.value?.clientSecret);
    if (next) {
      m365Config.value = { ...m365Config.value, clientSecret: next };
      await adminRepo.save(m365Config);
      console.log('MIGRATED m365_config.clientSecret');
      migrated++;
    }
  }

  // Network device SSH credentials
  const creds = await credRepo.find();
  for (const cred of creds) {
    let changed = false;
    const nextUsername = migrateField(`networkDeviceCredential[${cred.deviceId}].sshUsername`, cred.sshUsername);
    if (nextUsername) {
      cred.sshUsername = nextUsername;
      changed = true;
    }
    const nextPassword = migrateField(`networkDeviceCredential[${cred.deviceId}].sshPassword`, cred.sshPassword);
    if (nextPassword) {
      cred.sshPassword = nextPassword;
      changed = true;
    }
    if (changed) {
      await credRepo.save(cred);
      console.log(`MIGRATED networkDeviceCredential[${cred.deviceId}]`);
      migrated++;
    }
  }

  console.log(`Done. ${migrated} field(s) migrated to AES-256-GCM.`);
  await app.close();
  process.exit(0);
}
main().catch((e) => {
  console.error('MIGRATION_FAILED', e);
  process.exit(1);
});
