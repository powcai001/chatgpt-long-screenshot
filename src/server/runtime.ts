export function isProduction(entryPath: string, nodeEnv: string | undefined): boolean {
  return nodeEnv === "production" || /[/\\]dist[/\\]server[/\\]index\.js$/.test(entryPath);
}

export function formatDisplayHost(host: string): string {
  return host.includes(":") ? `[${host}]` : host;
}
