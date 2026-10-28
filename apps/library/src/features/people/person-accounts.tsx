import { useState } from 'react';
import { Button, ChoiceSelect, Input, SectionHeading, Text, Panel } from '@clipkit/ui';
import { css } from '@clipkit/ui/css';
import type { Account, LibraryClient } from '../../services/library-client';
import { safeWebURL } from './profile-model';

export function PersonAccounts({
  name,
  accounts,
  busy,
  mutate,
}: {
  name: string;
  accounts: Account[];
  busy: boolean;
  mutate: (work: (api: LibraryClient) => Promise<unknown>, message: string) => Promise<boolean>;
}) {
  const [query, setQuery] = useState(''),
    [choice, setChoice] = useState(''),
    [url, setURL] = useState('');
  const connected = accounts.filter((account) => account.person === name);
  const available = accounts.filter((account) => !account.person);
  const matches = connected.filter((account) =>
    [account.platform, account.handle, account.displayName]
      .join(' ')
      .toLocaleLowerCase()
      .includes(query.trim().toLocaleLowerCase()),
  );
  async function connectExisting() {
    const account = available.find(
      (account) => JSON.stringify([account.platform, account.handle]) === choice,
    );
    if (account && (await mutate((api) => api.connectAccount(name, account), 'Account connected.')))
      setChoice('');
  }
  async function connectURL() {
    if (!safeWebURL(url)) return;
    if (await mutate((api) => api.createAccount(name, url.trim()), 'Account connected.'))
      setURL('');
  }
  return (
    <Panel asChild padding="roomy">
      <section
        aria-label="Connected accounts"
        className={css({ display: 'grid', gap: '4', mt: '8' })}
      >
        <SectionHeading
          title="Connected accounts"
          description="Accounts connect their uploads and credited appearances to this person."
        />
        <Input
          aria-label="Search connected accounts"
          placeholder="Search accounts…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        {matches.map((account) => (
          <div
            key={JSON.stringify([account.platform, account.handle])}
            className={css({
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '3',
            })}
          >
            <div>
              <Text>{account.displayName || account.handle}</Text>
              <Text size="sm" tone="muted">
                {account.platform} · {account.handle}
              </Text>
            </div>
            <div className={css({ display: 'flex', gap: '3', flexWrap: 'wrap' })}>
              {safeWebURL(account.url) && (
                <Button asChild variant="neutral">
                  <a href={safeWebURL(account.url)!} target="_blank" rel="noopener noreferrer">
                    View account
                  </a>
                </Button>
              )}
              <Button
                disabled={busy}
                onClick={() =>
                  void mutate((api) => api.connectAccount('', account), 'Account disconnected.')
                }
              >
                Disconnect {account.handle}
              </Button>
            </div>
          </div>
        ))}
        {!matches.length && (
          <Text tone="muted">
            {connected.length ? 'No matching accounts.' : 'No accounts connected yet.'}
          </Text>
        )}
        <fieldset disabled={busy} className={css({ display: 'grid', gap: '4', minW: '0' })}>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void connectURL();
            }}
            className={css({ display: 'grid', gap: '3' })}
          >
            <label>
              Account profile URL
              <Input
                type="url"
                required
                value={url}
                onChange={(event) => setURL(event.target.value)}
              />
            </label>
            <Button type="submit" disabled={!safeWebURL(url)} variant="primary">
              Connect URL
            </Button>
          </form>
          <ChoiceSelect
            label="Existing unassigned account"
            value={choice}
            onChange={setChoice}
            options={available.map((account) => ({
              value: JSON.stringify([account.platform, account.handle]),
              label: `${account.platform} · ${account.handle}`,
            }))}
          />
          <Button disabled={!choice || busy} onClick={() => void connectExisting()}>
            Connect account
          </Button>
        </fieldset>
      </section>
    </Panel>
  );
}
