import { describe, expect, it } from 'vitest';
import { createMobileProductionMediaController } from './production-media-controller';

describe('mobile production media controller wrapper', () => {
  it('ships with source disabled and no admitted origin', async () => {
    const controller = createMobileProductionMediaController({});
    await controller.recheck();
    expect(controller.getState()).toMatchObject({
      phase: 'unavailable',
      reason: 'source-disabled',
      active: null,
    });
    controller.dispose();
  });
});
