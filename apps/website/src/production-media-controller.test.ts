import { describe, expect, it } from 'vitest';
import { createWebsiteProductionMediaController } from './production-media-controller';

describe('website production media controller wrapper', () => {
  it('ships with source disabled and no admitted origin', async () => {
    const controller = createWebsiteProductionMediaController({});
    await controller.recheck();
    expect(controller.getState()).toMatchObject({
      phase: 'unavailable',
      reason: 'source-disabled',
      active: null,
    });
    controller.dispose();
  });
});
