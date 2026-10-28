import { useState } from 'react';
import { Button, Disclosure, Input, Text, TextLink } from '@clipkit/ui';
import { css } from '@clipkit/ui/css';

export function ConnectionPanel({
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
    <Disclosure.Root className={css({ my: '4' })}>
      <Disclosure.Summary>Library connection</Disclosure.Summary>
      <form
        className={css({ display: 'grid', gap: '3', mt: '3', maxW: 'container.regular' })}
        onSubmit={(event) => {
          event.preventDefault();
          onConnect(address);
        }}
      >
        <label>
          Backend server
          <Input
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            placeholder="http://localhost:8899"
            disabled={busy}
          />
        </label>
        <Text size="sm" tone="muted">
          Use the address of your running ClipKit backend. Leave empty for this website’s server.
          The desktop app discovers its backend automatically.
        </Text>
        <Button type="submit" disabled={busy}>
          Connect
        </Button>
        <TextLink href="?demo=1">Open the synthetic demo</TextLink>
      </form>
    </Disclosure.Root>
  );
}
