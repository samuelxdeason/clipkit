import { Clock, ExternalLink, Film, Globe, Heart, Pencil } from 'lucide-react';
import { Button, Heading, Icon, Identity, Panel, Rule, Stat, Text } from '@clipkit/ui';
import { css } from '@clipkit/ui/css';
import { IdentityPortrait } from '../../components/browsing/directory-card';
import { IdentityWash, identityToneName } from '../../components/browsing/identity-style';
import { safeWebURL, type ProfileData } from './profile-model';
import type { ProfileAction } from './profile-dialog';

/** Presentation only: profile reads, drafts and mutations remain in their owning hooks/dialogs. */
export function PersonProfileHeader({
  name,
  profile,
  cover,
  busy,
  manage,
  onAction,
}: {
  name: string;
  profile: ProfileData;
  cover?: string;
  busy: boolean;
  manage: boolean;
  onAction: (action: ProfileAction) => void;
}) {
  const displayName = profile.info.nickname || profile.person.nickname || name;
  const tone = identityToneName(name);
  const minutes = Math.round(
    profile.videos.reduce((sum, video) => sum + (video.duration || 0), 0) / 60,
  );
  const stats = [
    { label: 'Videos', value: profile.videos.length, icon: Film },
    {
      label: 'Favorites',
      value: profile.videos.filter((video) => video.favorite).length,
      icon: Heart,
    },
    {
      label: 'Video runtime',
      value: minutes >= 60 ? `${(minutes / 60).toFixed(1)} hr` : `${minutes} min`,
      icon: Clock,
    },
    {
      label: 'Video sources',
      value: new Set(profile.videos.map((video) => video.site).filter(Boolean)).size,
      icon: Globe,
    },
  ];
  const links = (profile.info.links || []).filter((link) => safeWebURL(link.url));
  return (
    <Panel asChild padding="none">
      <section
        aria-label="Person profile"
        className={css({ overflow: 'hidden', position: 'relative', isolation: 'isolate' })}
      >
        <IdentityWash name={name} placement="hero" />
        <div
          className={css({
            position: 'relative',
            display: 'grid',
            gridTemplateColumns: { base: 'minmax(0, 1fr)', md: '240px minmax(0, 1fr)' },
            gap: { base: '6', md: '8' },
            p: { base: '5', md: '8' },
            alignItems: 'center',
          })}
        >
          <div
            className={css({
              w: 'full',
              maxW: '[240px]',
              justifySelf: { base: 'center', md: 'start' },
            })}
          >
            <IdentityPortrait name={name} src={cover} />
          </div>
          <div className={css({ minW: '0', display: 'grid', gap: '5', overflowWrap: 'anywhere' })}>
            <div
              className={css({
                display: 'flex',
                flexDirection: { base: 'column', sm: 'row' },
                flexWrap: 'wrap',
                justifyContent: 'space-between',
                alignItems: 'start',
                gap: '4',
              })}
            >
              <div className={css({ display: 'grid', gap: '2', minW: '0', flex: '1' })}>
                <Identity tone={tone} asChild>
                  <Text as="span" variant="eyebrow">
                    Person in your library
                  </Text>
                </Identity>
                <Heading
                  as="h1"
                  size="lg"
                  fontSize={{ base: 'headingCompact', md: '[clamp(2rem, 3.5vw, 3.25rem)]' }}
                >
                  {displayName}
                </Heading>
                {displayName !== name && (
                  <Text size="sm" tone="muted">
                    {name}
                  </Text>
                )}
              </div>
              <Button disabled={busy} variant="neutral" onClick={() => onAction('edit')}>
                <Icon glyph={Pencil} size="sm" />
                Edit profile
              </Button>
            </div>
            <Text tone="muted" className={css({ maxW: '[65ch]', whiteSpace: 'pre-wrap' })}>
              {profile.info.bio || 'Add a display name and notes to make this profile your own.'}
            </Text>
            <Rule asChild side="top">
              <dl
                aria-label="Library summary"
                className={css({
                  display: 'grid',
                  gridTemplateColumns: {
                    base: 'repeat(2, minmax(0, 1fr))',
                    lg: 'repeat(4, minmax(0, 1fr))',
                  },
                  gap: '4',
                })}
              >
                {stats.map((stat) => (
                  <Stat.Root key={stat.label}>
                    <Stat.Label>
                      <Identity tone={tone}>
                        <Icon glyph={stat.icon} size="sm" />
                      </Identity>
                      {stat.label}
                    </Stat.Label>
                    <Stat.Value>{stat.value.toLocaleString()}</Stat.Value>
                  </Stat.Root>
                ))}
              </dl>
            </Rule>
            {links.length > 0 && (
              <div
                aria-label="Profile links"
                className={css({ display: 'flex', flexWrap: 'wrap', gap: '2' })}
              >
                <Text size="sm" tone="muted" alignSelf="center">
                  Find them online
                </Text>
                {links.map((link, index) => (
                  <Button key={index} asChild size="compact" variant="neutral" maxW="full">
                    <a href={safeWebURL(link.url)!} target="_blank" rel="noopener noreferrer">
                      <span className={css({ overflowWrap: 'anywhere', whiteSpace: 'normal' })}>
                        {link.label || link.url}
                      </span>
                      <Icon glyph={ExternalLink} size="sm" />
                    </a>
                  </Button>
                ))}
              </div>
            )}
          </div>
        </div>
        {manage && (
          <Rule
            side="top"
            aria-label="Manage person"
            className={css({
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: '3',
              p: '5',
              position: 'relative',
            })}
          >
            <Text size="sm" tone="muted" flex="1">
              Manage this person's identity and library associations.
            </Text>
            <Button disabled={busy} onClick={() => onAction('rename')}>
              Rename person
            </Button>
            <Button variant="danger" disabled={busy} onClick={() => onAction('delete')}>
              Delete person
            </Button>
          </Rule>
        )}
      </section>
    </Panel>
  );
}
