/** Test-only genuine bundled-release, real IDB and fake-Audio UI harness. */
import { createRoot, type Root } from 'react-dom/client';
import { compileProductionMediaProviderPolicyV1 } from '@wrn/content-contracts/production-media-v1';
import { createMobileProductionMediaController } from '../../apps/mobile/src/production-media-controller';
import { openProductionMediaOfflineStore as openMobileOffline } from '../../apps/mobile/src/production-media-offline-store';
import { createWebsiteProductionMediaController } from '../../apps/website/src/production-media-controller';
import { openProductionMediaOfflineStore as openWebsiteOffline } from '../../apps/website/src/production-media-offline-store';
import { productionMediaInitialReleaseV1 } from '../../packages/browser-content/src/data/production-media-initial-release-v1';
import { createProductionMediaInitialSource } from '../../packages/browser-content/src/production-media-initial-source';
import type { ProductionMediaAudio } from '../../packages/browser-content/src/production-media-player';
import { createProductionMediaResumeStoreFactory } from '../../packages/browser-content/src/production-media-resume-store';
import {
  ManagedProductionMediaExperience,
  type ProductionMediaControllerFactory,
} from '../../packages/browser-content/src/production-media-ui';

type Client = 'mobile' | 'website';
type Controller = ReturnType<typeof createMobileProductionMediaController>;
type TestAudio = ProductionMediaAudio & {
  readonly plays: number;
  readonly srcWrites: number;
};

const now = Date.parse('2026-09-13T12:00:00.000Z');
const recipientOrigin = 'https://dn721204.ca.archive.org';
const privacyNoticeUrl = 'https://archive.org/about/terms';

function makeAudio(): TestAudio {
  let sourceUrl = '';
  let plays = 0;
  let srcWrites = 0;
  const audio = {
    crossOrigin: null as string | null,
    preload: '' as HTMLMediaElement['preload'],
    duration: 1806.47,
    currentTime: 0,
    onloadedmetadata: null as HTMLMediaElement['onloadedmetadata'],
    ondurationchange: null as HTMLMediaElement['ondurationchange'],
    onerror: null as HTMLMediaElement['onerror'],
    onpause: null as HTMLMediaElement['onpause'],
    onended: null as HTMLMediaElement['onended'],
    ontimeupdate: null as HTMLMediaElement['ontimeupdate'],
    get src() {
      return sourceUrl;
    },
    set src(value: string) {
      sourceUrl = value;
      srcWrites++;
    },
    get plays() {
      return plays;
    },
    get srcWrites() {
      return srcWrites;
    },
    play() {
      plays++;
      return Promise.resolve();
    },
    pause() {
      audio.onpause?.call(audio as unknown as HTMLAudioElement, new Event('pause'));
    },
    load() {},
    removeAttribute(name: string) {
      if (name === 'src') sourceUrl = '';
    },
  };
  return audio;
}

export async function mountProductionMediaFirstBootHarness(client: Client) {
  const openOffline = client === 'mobile' ? openMobileOffline : openWebsiteOffline;
  const resumeName = `wrn.${client}-production-media-resume.v1` as const;
  const openResume = createProductionMediaResumeStoreFactory(resumeName);
  const beforeOfflineHandle = await openOffline();
  const beforeOffline = await beforeOfflineHandle.snapshot();
  beforeOfflineHandle.close();
  const beforeResumeHandle = await openResume();
  const beforeResume = await beforeResumeHandle.snapshot();
  beforeResumeHandle.close();

  const origins = new Set([recipientOrigin]);
  const providerPolicy = compileProductionMediaProviderPolicyV1(
    {
      kind: 'production-media-provider-policy-v1',
      relationships: [{ recipientOrigin, privacyNoticeUrl }],
    },
    origins,
  );
  if (!providerPolicy) throw new Error('test provider policy');

  let operation = 0;
  const audios: TestAudio[] = [];
  const controllers: Controller[] = [];
  const roots: Root[] = [];
  const createController: ProductionMediaControllerFactory = (onState) => {
    const audio = () => {
      const value = makeAudio();
      audios.push(value);
      return value;
    };
    const ports = {
      source: null,
      initialSource: createProductionMediaInitialSource({
        raw: productionMediaInitialReleaseV1,
        allowedOrigins: origins,
        providerPolicy,
        now: () => now,
      }),
      allowedOrigins: origins,
      providerPolicy,
      now: () => now,
      operationId: () => `first-boot-${client}-${++operation}`,
      online: () => true,
      audio,
      onState,
    } as const;
    const controller =
      client === 'mobile'
        ? createMobileProductionMediaController(ports)
        : createWebsiteProductionMediaController(ports);
    controllers.push(controller);
    return controller;
  };

  const mount = (container: HTMLElement) => {
    const root = createRoot(container);
    roots.push(root);
    root.render(
      <ManagedProductionMediaExperience
        createController={createController}
        language="en"
        headingLevel={2}
      />,
    );
  };
  const primary = document.querySelector<HTMLElement>('#root');
  if (!primary) throw new Error('missing test root');
  mount(primary);

  const snapshots = async () => {
    const offline = await openOffline();
    const resume = await openResume();
    try {
      return { offline: await offline.snapshot(), resume: await resume.snapshot() };
    } finally {
      offline.close();
      resume.close();
    }
  };
  const api = Object.freeze({
    client,
    before: Object.freeze({ offline: beforeOffline, resume: beforeResume }),
    audioCount: () => audios.length,
    audio: (index: number) => {
      const audio = audios[index];
      return audio
        ? {
            currentTime: audio.currentTime,
            duration: audio.duration,
            plays: audio.plays,
            src: audio.src,
            srcWrites: audio.srcWrites,
          }
        : null;
    },
    setCurrentTime: (index: number, seconds: number) => {
      const audio = audios[index];
      if (!audio) throw new Error('missing fake Audio');
      audio.currentTime = seconds;
      audio.ontimeupdate?.call(audio as unknown as HTMLAudioElement, new Event('timeupdate'));
    },
    metadata: (index: number) => {
      const audio = audios[index];
      if (!audio) throw new Error('missing fake Audio');
      audio.onloadedmetadata?.call(
        audio as unknown as HTMLAudioElement,
        new Event('loadedmetadata'),
      );
    },
    state: (index: number) => {
      const state = controllers[index]?.getState();
      return state
        ? {
            phase: state.phase,
            reason: state.reason,
            active: state.active !== null,
            player: state.player,
            resume: state.resume,
          }
        : null;
    },
    recheck: (index: number) => controllers[index]?.recheck(),
    snapshots,
    mountSecondary: () => {
      const container = document.createElement('div');
      container.id = 'secondary-root';
      document.body.append(container);
      mount(container);
    },
    dispose: () => roots.forEach((root) => root.unmount()),
  });
  Object.assign(window, { wrnProductionMediaFirstBoot: api });
  return api;
}
