import {
  createTranslationRuntimeFetchFromEnvironment,
  type TranslationRuntimeEnvironment,
} from './runtime.js';

/**
 * Deployable entry point for a separately reviewed Worker environment. The
 * committed configuration keeps it disabled, so this never dispatches to a
 * provider until a later platform activation supplies every required binding.
 */
const worker = {
  fetch(request: Request, environment: TranslationRuntimeEnvironment): Promise<Response> {
    return createTranslationRuntimeFetchFromEnvironment(environment)(request);
  },
};

export default worker;
