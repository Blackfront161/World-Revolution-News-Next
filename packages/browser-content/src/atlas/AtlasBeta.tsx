import { useEffect, useMemo, useState } from 'react';
import type { MobileContentDirectory } from '@wrn/content-contracts/mobile-content-directory-v1';
import type { UiLanguage } from '@wrn/ui-language';
import { getAtlasCopy } from '@wrn/ui-language/atlas';
import { getDirectoryCopy } from '@wrn/ui-language/directory';
import { makeAtlasRound, projectAtlasEntries } from './atlas-model';
import './atlas.css';

type LoadedDirectory = Readonly<{ projection: MobileContentDirectory }>;

export function AtlasBeta({
  language,
  load,
}: {
  language: UiLanguage;
  load: (signal: AbortSignal) => Promise<LoadedDirectory>;
}) {
  const copy = getAtlasCopy(language);
  const directoryCopy = getDirectoryCopy(language);
  const [open, setOpen] = useState(false);
  const [directory, setDirectory] = useState<MobileContentDirectory | null>(null);
  const [failed, setFailed] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState('');
  const [shown, setShown] = useState(12);
  const [roundIndex, setRoundIndex] = useState(0);
  const [answer, setAnswer] = useState<string | null>(null);
  const [correct, setCorrect] = useState(0);

  useEffect(() => {
    if (!open || directory !== null) return;
    const controller = new AbortController();
    setFailed(false);
    load(controller.signal)
      .then((value) => {
        if (!controller.signal.aborted) setDirectory(value.projection);
      })
      .catch(() => {
        if (!controller.signal.aborted) setFailed(true);
      });
    return () => controller.abort();
  }, [directory, load, open]);

  const entries = useMemo(() => (directory ? projectAtlasEntries(directory) : []), [directory]);
  const countries = [...new Set(entries.map((entry) => entry.country))].sort();
  const visible = entries.filter((entry) => !selectedCountry || entry.country === selectedCountry);
  const round = makeAtlasRound(entries, roundIndex);
  const names = useMemo(() => {
    try {
      return new Intl.DisplayNames([language], { type: 'region' });
    } catch {
      return null;
    }
  }, [language]);
  const country = (code: string) => names?.of(code) ?? code;

  return (
    <section className="wrn-atlas" aria-label="World Revolution Atlas" data-testid="wrn-atlas-beta">
      <div className="wrn-atlas__heading">
        <div>
          <p className="wrn-atlas__eyebrow">Beta</p>
          <h2>World Revolution Atlas</h2>
        </div>
        <button type="button" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
          {open ? copy.close : copy.open}
        </button>
      </div>
      <p>{copy.intro}</p>
      {open && (
        <div className="wrn-atlas__body">
          {directory === null ? (
            <p role="status">{failed ? directoryCopy.loadError : directoryCopy.loading}</p>
          ) : (
            <>
              <label className="wrn-atlas__filter">
                {copy.explore}
                <select
                  value={selectedCountry}
                  onChange={(event) => {
                    setSelectedCountry(event.target.value);
                    setShown(12);
                  }}
                >
                  <option value="">
                    {directoryCopy.all} · {entries.length}
                  </option>
                  {countries.map((code) => (
                    <option key={code} value={code}>
                      {country(code)}
                    </option>
                  ))}
                </select>
              </label>
              <p role="status">
                {directoryCopy.sources}: {visible.length}
              </p>
              <ul className="wrn-atlas__sources">
                {visible.slice(0, shown).map((entry) => (
                  <li key={entry.id}>
                    <strong>{entry.name}</strong>
                    <span>{country(entry.country)}</span>
                  </li>
                ))}
              </ul>
              {visible.length > shown && (
                <button type="button" onClick={() => setShown((value) => value + 12)}>
                  {directoryCopy.loadMore}
                </button>
              )}
              <a href="#discover/sources">{directoryCopy.sources}</a>
              <div className="wrn-atlas__quiz">
                <h3>{copy.quiz}</h3>
                {round === null ? (
                  <p role="status">{directoryCopy.noResults}</p>
                ) : (
                  <>
                    <p>{copy.question}</p>
                    <p className="wrn-atlas__question">
                      <strong>{round.source.name}</strong>
                    </p>
                    <div className="wrn-atlas__options" role="group" aria-label={copy.question}>
                      {round.options.map((option) => (
                        <button
                          key={option}
                          type="button"
                          aria-pressed={answer === option}
                          disabled={answer !== null}
                          onClick={() => {
                            setAnswer(option);
                            if (option === round.answer) setCorrect((value) => value + 1);
                          }}
                        >
                          {country(option)}
                        </button>
                      ))}
                    </div>
                    {answer !== null && (
                      <p role="status" className="wrn-atlas__feedback">
                        {answer === round.answer
                          ? copy.correct
                          : `${copy.incorrect} ${country(round.answer)}`}
                      </p>
                    )}
                    <p>
                      {copy.score}: {correct}/{roundIndex + (answer === null ? 0 : 1)}
                    </p>
                    <button
                      type="button"
                      disabled={answer === null}
                      onClick={() => {
                        setRoundIndex((value) => value + 1);
                        setAnswer(null);
                      }}
                    >
                      {copy.next}
                    </button>
                  </>
                )}
              </div>
              <p className="wrn-atlas__note">{copy.evidence}</p>
            </>
          )}
        </div>
      )}
    </section>
  );
}
