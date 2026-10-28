import { useEffect, useRef, useState } from 'react';
import { Button, Dialog, Input, Portal, Text } from '@clipkit/ui';
import { css } from '@clipkit/ui/css';
import type { LibraryClient, PersonInfo } from '../../services/library-client';
import { safeWebURL, type ProfileData } from './profile-model';
export type ProfileAction = 'edit' | 'rename' | 'delete' | null;
export function ProfileDialog({
  action,
  onClose,
  data,
  busy,
  error,
  mutate,
}: {
  action: ProfileAction;
  onClose: () => void;
  data: ProfileData;
  busy: boolean;
  error: string;
  mutate: (work: (api: LibraryClient) => Promise<unknown>, message: string) => Promise<boolean>;
}) {
  const [draft, setDraft] = useState<PersonInfo>(data.info),
    [name, setName] = useState(data.person.name),
    [validation, setValidation] = useState('');
  const previous = useRef<ProfileAction>(null);
  useEffect(() => {
    if (action && previous.current !== action) {
      setDraft({ ...data.info, links: data.info.links || [] });
      setName(data.person.name);
      setValidation('');
    }
    previous.current = action;
  }, [action, data.info, data.person.name]);
  async function save() {
    setValidation('');
    if (action === 'edit') {
      if ((draft.links || []).some((link) => !safeWebURL(link.url))) {
        setValidation('Profile links must be valid HTTP or HTTPS URLs.');
        return;
      }
      if (
        await mutate(
          (api) =>
            api.savePerson({ ...draft, nickname: draft.nickname.trim(), bio: draft.bio.trim() }),
          'Profile saved.',
        )
      )
        onClose();
    } else if (action === 'rename') {
      const next = name.trim();
      if (
        !next ||
        data.people.some((person) => person.name === next && person.name !== data.person.name)
      ) {
        setValidation('Choose a unique person name.');
        return;
      }
      if (await mutate((api) => api.renamePerson(data.person.name, next), 'Person renamed.'))
        window.location.assign(`/?view=person&name=${encodeURIComponent(next)}`);
    } else if (action === 'delete') {
      if (await mutate((api) => api.deletePerson(data.person.name), 'Person deleted.'))
        window.location.assign('/?view=people');
    }
  }
  const title =
    action === 'edit' ? 'Edit profile' : action === 'rename' ? 'Rename person' : 'Delete person?';
  return (
    <Dialog.Root
      open={action !== null}
      closeOnEscape={!busy}
      closeOnInteractOutside={!busy}
      onOpenChange={(event) => {
        if (!event.open && !busy) onClose();
      }}
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Title>{title}</Dialog.Title>
            <Dialog.Description>
              {action === 'delete'
                ? 'This removes the profile, disconnects its accounts and removes its person tags. Media files are kept. There is no in-app Undo.'
                : action === 'rename'
                  ? 'Change the registered name used by this person’s associations. Use the display name for a cosmetic change.'
                  : 'Update the display name, notes and profile links. The registered name stays unchanged.'}
            </Dialog.Description>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void save();
              }}
              className={css({ display: 'grid', gap: '4' })}
            >
              <fieldset disabled={busy} className={css({ display: 'grid', gap: '4', minW: '0' })}>
                {action === 'edit' && (
                  <>
                    <label>
                      Display name
                      <Input
                        value={draft.nickname}
                        onChange={(event) =>
                          setDraft((current) => ({ ...current, nickname: event.target.value }))
                        }
                      />
                    </label>
                    <label>
                      About this person
                      <Input asChild minH="32" aria-label="About this person">
                        <textarea
                          rows={4}
                          value={draft.bio}
                          onChange={(event) =>
                            setDraft((current) => ({ ...current, bio: event.target.value }))
                          }
                        />
                      </Input>
                    </label>
                    <Text size="sm">Profile links</Text>
                    {(draft.links || []).map((link, index) => (
                      <div key={index} className={css({ display: 'grid', gap: '2' })}>
                        <Input
                          aria-label={`Link ${index + 1} label`}
                          value={link.label}
                          onChange={(event) =>
                            setDraft((current) => ({
                              ...current,
                              links: (current.links || []).map((item, i) =>
                                i === index ? { ...item, label: event.target.value } : item,
                              ),
                            }))
                          }
                        />
                        <Input
                          aria-label={`Link ${index + 1} URL`}
                          type="url"
                          required
                          value={link.url}
                          onChange={(event) =>
                            setDraft((current) => ({
                              ...current,
                              links: (current.links || []).map((item, i) =>
                                i === index ? { ...item, url: event.target.value } : item,
                              ),
                            }))
                          }
                        />
                        <Button
                          size="sm"
                          variant="plain"
                          onClick={() =>
                            setDraft((current) => ({
                              ...current,
                              links: (current.links || []).filter((_, i) => i !== index),
                            }))
                          }
                        >
                          Remove link {index + 1}
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      onClick={() =>
                        setDraft((current) => ({
                          ...current,
                          links: [...(current.links || []), { label: '', url: '' }],
                        }))
                      }
                    >
                      Add profile link
                    </Button>
                  </>
                )}
                {action === 'rename' && (
                  <label>
                    Registered name
                    <Input
                      required
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                    />
                  </label>
                )}
              </fieldset>
              {(validation || error) && (
                <Text role="alert" tone="danger">
                  {validation || error}
                </Text>
              )}
              <Dialog.Footer>
                <Dialog.CloseTrigger asChild aria-label="Cancel">
                  <Button disabled={busy} variant="plain">
                    Cancel
                  </Button>
                </Dialog.CloseTrigger>
                <Button
                  type="submit"
                  variant={action === 'delete' ? 'surface' : 'solid'}
                  tone={action === 'delete' ? 'danger' : undefined}
                  loading={busy}
                  disabled={
                    action === 'rename' && (!name.trim() || name.trim() === data.person.name)
                  }
                >
                  {action === 'edit'
                    ? 'Save profile'
                    : action === 'rename'
                      ? 'Rename person'
                      : 'Confirm deletion'}
                </Button>
              </Dialog.Footer>
            </form>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
