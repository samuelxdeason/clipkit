import { useState } from 'react';
import { Button, Input, Text } from '@clipkit/ui';
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
    <details className={css({ my: '4' })}>
      <summary className={css({ cursor: 'pointer', color: 'muted', fontSize: 'sm' })}>
        Library connection
      </summary>
      <form
        className={css({ display: 'grid', gap: '3', mt: '3', maxW: 'lg' })}
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
        <a
          href="?demo=1"
          className={css({ color: 'muted', textDecoration: 'underline', fontSize: 'sm' })}
        >
          Open the synthetic demo
        </a>
      </form>
    </details>
  );
}
