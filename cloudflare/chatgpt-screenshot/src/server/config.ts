import { networkInterfaces } from "node:os";

export interface AppConfig {
  host: string;
  port: number;
  lanMode: boolean;
}

const LOOPBACK_HOSTS = new Set(["127.0.0.1", "localhost", "::1"]);

export function loadConfig(env: NodeJS.ProcessEnv): AppConfig {
  const host = env.HOST ?? "127.0.0.1";
  const port = parsePort(env.PORT ?? "4173");

  if (!isAllowedHost(host)) {
    throw new Error("invalid_host");
  }

  return { host, port, lanMode: host === "0.0.0.0" };
}

function parsePort(value: string): number {
  if (!/^\d+$/.test(value)) {
    throw new Error("invalid_port");
  }

  const port = Number(value);
  if (!Number.isSafeInteger(port) || port < 1 || port > 65_535) {
    throw new Error("invalid_port");
  }

  return port;
}

function isAllowedHost(host: string): boolean {
  return LOOPBACK_HOSTS.has(host) || host === "0.0.0.0" || isLocalInterfaceIp(host);
}

function isLocalInterfaceIp(host: string): boolean {
  for (const addresses of Object.values(networkInterfaces())) {
    if (addresses?.some((address) => address.address === host)) {
      return true;
    }
  }

  return false;
}
