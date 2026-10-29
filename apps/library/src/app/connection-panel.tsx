import { useState } from 'react';
import { Server } from 'lucide-react';
import { Button, Heading, Input, SettingsCard, Text, TextLink } from '@clipkit/ui';
import { css } from '@clipkit/ui/css';

/**
 * The backend address, as a Settings section. Every page reads the saved
 * address on load; the desktop app discovers its backend on its own.
 */
export function ConnectionSection({
  server,
  onConnect,
  busy,
}: {
  server: string;
  onConnect: (server: string) => void;
  busy: boolean;
}) {
  const [address, setAddress] = useState(server);
  return (
    <section aria-labelledby="settings-server">
      <Heading id="settings-server" size="sm" className={css({ mb: '4' })}>
        Connection
      </Heading>
      <SettingsCard.Root>
        <SettingsCard.Row>
          <SettingsCard.Icon aria-hidden="true">
            <Server />
          </SettingsCard.Icon>
          <SettingsCard.Copy>
            <SettingsCard.Title>Backend server</SettingsCard.Title>
            <SettingsCard.Detail>
              The running ClipKit backend this app reads from. Leave it empty for this website’s own
              server; the desktop app discovers its backend automatically.
            </SettingsCard.Detail>
          </SettingsCard.Copy>
          <SettingsCard.Control>
            <form
              className={css({ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '2' })}
              onSubmit={(event) => {
                event.preventDefault();
                onConnect(address);
              }}
            >
              <Input
                aria-label="Backend server"
                value={address}
                onChange={(event) => setAddress(event.target.value)}
                placeholder="http://localhost:8899"
                disabled={busy}
                className={css({ w: '[260px]', maxW: 'full' })}
              />
              <Button type="submit" disabled={busy}>
                Connect
              </Button>
            </form>
          </SettingsCard.Control>
        </SettingsCard.Row>
      </SettingsCard.Root>
      <Text size="sm" tone="muted" className={css({ mt: '3' })}>
        Trying the app without a backend?{' '}
        <TextLink href="/?demo=1">Open the synthetic demo</TextLink>.
      </Text>
    </section>
  );
}
