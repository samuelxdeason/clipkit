import { useRef, useState } from 'react';
import { ArrowRight, Check, Heart, Plus, Search } from 'lucide-react';
import { Button, Heading, Icon, IconButton, Input, Text } from '@clipkit/ui';
import { css } from '@clipkit/ui/css';

const section = css({
  bg: 'surface',
  borderWidth: '1px',
  borderStyle: 'solid',
  borderColor: 'line',
  borderRadius: 'panel',
  p: { base: '5', md: '8' },
  display: 'grid',
  gap: '6',
});
const row = css({ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '3' });

export function Foundation() {
  const [favorite, setFavorite] = useState(false);
  const [saved, setSaved] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  return (
    <main
      className={css({
        maxW: '7xl',
        mx: 'auto',
        px: { base: '5', md: '10' },
        py: '8',
        display: 'grid',
        gap: '10',
      })}
    >
      <header
        className={css({
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottomWidth: '1px',
          borderBottomStyle: 'solid',
          borderColor: 'line',
          pb: '6',
        })}
      >
        <Heading as="p" size="md">
          clipkit<span className={css({ color: 'accent' })}>.</span>
        </Heading>
        <Text size="sm" tone="muted">
          Design foundation / 01
        </Text>
      </header>
      <section
        className={css({ display: 'grid', gap: '5', maxW: '3xl', py: { base: '4', md: '8' } })}
      >
        <Text size="sm" tone="muted">
          A quieter frame. A richer experience.
        </Text>
        <Heading as="h1" size="lg">
          Your library, beautifully considered.
        </Heading>
        <Text tone="muted">
          Charcoal surfaces, warm typography and a deliberate touch of cherry. A shared foundation
          for everything we build next.
        </Text>
        <div className={row}>
          <Button variant="primary" onClick={() => input.current?.focus()}>
            Explore the controls <Icon glyph={ArrowRight} />
          </Button>
          <Text size="sm" tone="muted">
            Synthetic demo · no library connection
          </Text>
        </div>
      </section>
      <div
        className={css({
          display: 'grid',
          gridTemplateColumns: { base: '1fr', lg: '1fr 1fr' },
          gap: '6',
        })}
      >
        <section className={section} aria-labelledby="actions-title">
          <div>
            <Text size="sm" tone="muted">
              01 / Actions
            </Text>
            <Heading id="actions-title">Clear choices, consistent states.</Heading>
          </div>
          <Text tone="muted">
            A primary action leads. Supporting controls stay neutral. Selection has its own visible
            state.
          </Text>
          <div className={row}>
            <Button variant="primary" onClick={() => setSaved(true)}>
              <Icon glyph={saved ? Check : Plus} />
              {saved ? 'Added to demo' : 'Add videos'}
            </Button>
            <Button onClick={() => setSaved(false)}>Reset demo</Button>
            <IconButton
              aria-label="Favorite demo"
              aria-pressed={favorite}
              onClick={() => setFavorite((value) => !value)}
            >
              <Icon glyph={Heart} />
            </IconButton>
          </div>
          <div className={row}>
            <Button disabled>Unavailable</Button>
            <Button loading loadingText="Saving…">
              Save
            </Button>
            <Button variant="danger">Remove</Button>
          </div>
          <Text size="sm" tone="muted" role="status">
            {saved
              ? 'Demo action complete. No files were changed.'
              : 'Try the controls with a mouse or keyboard.'}
          </Text>
        </section>
        <section className={section} aria-labelledby="form-title">
          <div>
            <Text size="sm" tone="muted">
              02 / Inputs
            </Text>
            <Heading id="form-title">Useful, even at the edges.</Heading>
          </div>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              setSaved(true);
            }}
            className={css({ display: 'grid', gap: '4' })}
          >
            <label className={css({ display: 'grid', gap: '2' })}>
              Library name
              <Input
                ref={input}
                name="library"
                placeholder="Weekend favorites"
                aria-describedby="name-help"
              />
            </label>
            <Text id="name-help" size="sm" tone="muted">
              A descriptive name makes a collection easier to find.
            </Text>
            <label className={css({ display: 'grid', gap: '2' })}>
              Example validation
              <Input
                aria-invalid="true"
                aria-describedby="name-error"
                defaultValue=""
                placeholder="Required field"
              />
            </label>
            <Text id="name-error" size="sm" tone="danger">
              Add a name before saving this example.
            </Text>
            <div className={row}>
              <Button type="submit" variant="neutral">
                Test form action
              </Button>
              <Icon glyph={Search} />
              <Text size="sm" tone="muted">
                Shared 42px controls
              </Text>
            </div>
          </form>
        </section>
      </div>
      <section className={section} aria-labelledby="palette-title">
        <div>
          <Text size="sm" tone="muted">
            03 / Color roles
          </Text>
          <Heading id="palette-title">Personality without visual noise.</Heading>
        </div>
        <div
          className={css({
            display: 'grid',
            gridTemplateColumns: { base: '1fr 1fr', md: 'repeat(4, 1fr)' },
            gap: '4',
          })}
        >
          <Swatch label="Cherry · action & focus" color="accent" />
          <Swatch label="Plum · identity" color="identity.plum" />
          <Swatch label="Blue · identity" color="identity.blue" />
          <Swatch label="Amber · identity" color="identity.amber" />
        </div>
        <Text size="sm" tone="muted">
          Identity colors decorate people and tags. They never replace selection, status or focus
          indicators.
        </Text>
      </section>
      <footer>
        <Text size="sm" tone="muted">
          Park UI components · Panda recipes · one shared theme
        </Text>
      </footer>
    </main>
  );
}

function Swatch({
  label,
  color,
}: {
  label: string;
  color: 'accent' | 'identity.plum' | 'identity.blue' | 'identity.amber';
}) {
  const tones = {
    accent: css({ bg: 'accent' }),
    'identity.plum': css({ bg: 'identity.plum' }),
    'identity.blue': css({ bg: 'identity.blue' }),
    'identity.amber': css({ bg: 'identity.amber' }),
  };
  return (
    <div className={css({ display: 'grid', gap: '3' })}>
      <div className={`${css({ h: '3', borderRadius: 'control' })} ${tones[color]}`} />
      <Text size="sm" tone="muted">
        {label}
      </Text>
    </div>
  );
}
