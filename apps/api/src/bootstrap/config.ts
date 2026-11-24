export function parseServerConfig(environment: NodeJS.ProcessEnv): { host: string; port: number } {
  const host = environment.HOST?.trim();
  if (!host) throw new Error('HOST is required');

  const rawPort = environment.PORT;
  const port = Number(rawPort);
  if (!rawPort || !/^\d+$/.test(rawPort) || !Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be an integer from 1 to 65535');
  }
  return { host, port };
}
