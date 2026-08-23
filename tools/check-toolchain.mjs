const expectedNodeVersion = '24.19.0';
const expectedPnpmVersion = '11.19.0';

const packageManagerUserAgent = process.env.npm_config_user_agent ?? '';
const failures = [];

if (process.versions.node !== expectedNodeVersion) {
  failures.push(`Node ${expectedNodeVersion} erwartet, ${process.versions.node} aktiv`);
}

if (!packageManagerUserAgent.startsWith(`pnpm/${expectedPnpmVersion} `)) {
  failures.push(
    `pnpm ${expectedPnpmVersion} erwartet, User-Agent "${packageManagerUserAgent || 'nicht gesetzt'}" aktiv`,
  );
}

if (failures.length > 0) {
  console.error(`Toolchain: fehlgeschlagen\n- ${failures.join('\n- ')}`);
  process.exitCode = 1;
} else {
  console.log(`Toolchain: Node ${expectedNodeVersion}, pnpm ${expectedPnpmVersion}`);
}
