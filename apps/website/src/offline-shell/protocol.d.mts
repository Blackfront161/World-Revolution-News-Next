export type ShellJob = { id: string; epoch: number; kind: 'register' | 'update' };
export type ShellGeneration = { id: string; bytes: number; ready: boolean; epoch: number };
export type ShellControl = {
  version: 1;
  compatibility: 'g3-015-v1';
  epoch: number;
  enabled: boolean;
  state: 'enabled' | 'removing' | 'removed';
  active: string | null;
  previous: string | null;
  generations: ShellGeneration[];
  pendingJob: ShellJob | null;
  removalJob: { id: string; epoch: number; phase: 'started' | 'settled' } | null;
};
export type ShellRead =
  { kind: 'missing' | 'malformed' | 'unknown' } | { kind: 'known'; value: ShellControl };
export function createShellProtocol(): {
  protocol: string;
  controlCache: string;
  controlKey: string;
  prefix: string;
  lock: string;
  maxMetadata: number;
  maxControlMetadata: number;
  maxManifestMetadata: number;
  maxBytes: number;
  initial(epoch: number): ShellControl;
  valid(value: unknown): value is ShellControl;
  parse(text: string | null): ShellRead;
  encode(control: ShellControl): string;
  read(storage: CacheStorage): Promise<ShellRead>;
  write(storage: CacheStorage, control: ShellControl): Promise<void>;
  message(value: unknown): boolean;
  metadata(value: unknown): boolean;
  inventory(storage: CacheStorage, control: ShellControl): Promise<string[]>;
};
