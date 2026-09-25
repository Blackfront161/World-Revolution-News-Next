export async function resolve(specifier, context, nextResolve) {
  try {
    return await nextResolve(specifier, context);
  } catch (error) {
    if (
      error instanceof Error &&
      'code' in error &&
      error.code === 'ERR_MODULE_NOT_FOUND' &&
      specifier.startsWith('.') &&
      specifier.endsWith('.js')
    )
      return nextResolve(`${specifier.slice(0, -3)}.ts`, context);
    throw error;
  }
}
