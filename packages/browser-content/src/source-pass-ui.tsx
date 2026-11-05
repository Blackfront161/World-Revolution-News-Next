import type { UiLanguage } from '@wrn/ui-language';
import { getSourcePassCopy, getSourcePassTechnicalValue } from '@wrn/ui-language/source-pass';
import type { SourcePassRecord } from '@wrn/content-contracts/source-pass-overlay-v1';
import { SourceProfile } from './source-preferences-ui';
import { sourceInitials } from './source-pass-overlay';

const externalProps = {
  target: '_blank',
  rel: 'noopener noreferrer',
  referrerPolicy: 'no-referrer' as const,
};

export function SourcePassCards({
  records,
  language,
  endpointUrl,
}: {
  records: readonly SourcePassRecord[];
  language: UiLanguage;
  endpointUrl(record: SourcePassRecord, id: string): string | null;
}) {
  const copy = getSourcePassCopy(language);
  return (
    <ul className="content-directory__list source-pass-list">
      {records.map((record) => {
        const original = record.endpoints.find(
          (entry) => entry.endpointId === record.originalEndpointId,
        )!;
        const originalUrl = endpointUrl(record, original.endpointId);
        const lastSuccess = record.endpoints
          .map((entry) => entry.lastSuccessfulAt)
          .filter((entry): entry is string => entry !== null)
          .sort()
          .at(-1);
        return (
          <li key={record.id} className="source-pass-card">
            <div className="source-pass-card__heading">
              <span className="source-pass-card__initials" aria-hidden="true">
                {sourceInitials(record.canonicalName)}
              </span>
              <div>
                <h3>{record.canonicalName}</h3>
                <p>{copy.initialsFallback}</p>
              </div>
            </div>
            <p>
              <strong>{copy.selfDescription}:</strong>{' '}
              <span lang={record.selfDescription.language}>{record.selfDescription.text}</span>
            </p>
            <p>
              <strong>{copy.editorialDescription}:</strong>{' '}
              <span lang={record.editorialDescription.language}>
                {record.editorialDescription.text}
              </span>
            </p>
            <p className="source-pass-card__identifier">
              <strong>{copy.stableId}:</strong> {record.id}
            </p>
            {record.aliasNames.length > 0 && (
              <p>
                <strong>{copy.aliases}:</strong> {record.aliasNames.join(' · ')}
              </p>
            )}
            <p>
              {[
                ...record.regions,
                ...record.countries,
                ...record.languages,
                ...record.topics,
                ...record.tendencies,
                ...record.mediaTypes,
              ].join(' · ')}
            </p>
            <p>
              <strong>{copy.endpointHealth}:</strong>{' '}
              {record.endpoints
                .map(
                  (entry) =>
                    `${getSourcePassTechnicalValue(language, entry.role)}: ${getSourcePassTechnicalValue(language, entry.health)}`,
                )
                .join(' · ')}
            </p>
            <p>
              <strong>{copy.lastSuccess}:</strong> {lastSuccess?.slice(0, 10) ?? copy.unchecked}
            </p>
            <p>
              <strong>{copy.rights}:</strong>{' '}
              {record.rights
                .map(
                  (entry) =>
                    `${getSourcePassTechnicalValue(language, entry.medium)}: ${getSourcePassTechnicalValue(language, entry.status)}`,
                )
                .join(' · ')}
            </p>
            <p>{copy.rightsCaveat}</p>
            <div className="source-pass-card__links">
              {originalUrl !== null && (
                <a href={originalUrl} {...externalProps}>
                  {copy.original}
                </a>
              )}
              {record.correctionContact.status === 'verified-url' && (
                <a href={record.correctionContact.url} {...externalProps}>
                  {copy.correctionContact}
                </a>
              )}
            </div>
            <SourceProfile
              catalog="directory"
              sourceId={record.preferenceAnchorEndpointId}
              name={record.canonicalName}
            />
          </li>
        );
      })}
    </ul>
  );
}
