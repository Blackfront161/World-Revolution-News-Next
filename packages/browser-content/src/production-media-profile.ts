// Trusted build configuration, deliberately separate from release metadata.
const recipientOrigin = 'https://dn721204.ca.archive.org';
export const productionMediaInitialProfile = Object.freeze({
  allowedOrigins: Object.freeze([recipientOrigin]),
  providerPolicy: Object.freeze({
    kind: 'production-media-provider-policy-v1' as const,
    relationships: Object.freeze([
      Object.freeze({ recipientOrigin, privacyNoticeUrl: 'https://archive.org/about/terms' }),
    ]),
  }),
});
export const productionMediaInitialCsp = `media-src ${recipientOrigin}`;
