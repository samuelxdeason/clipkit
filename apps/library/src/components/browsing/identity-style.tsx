import { Identity, identityClass, identityTones, type IdentityTone } from '@clipkit/ui';
import { identityIndex } from './directory-model';

/** Names, not ordering or current filters, choose decorative identity colors. */
export function identityToneName(name: string): IdentityTone {
  return identityTones[identityIndex(name) % identityTones.length];
}

/** The class that colours an element with the name's identity tone. */
export function identityTone(name: string) {
  return identityClass({ tone: identityToneName(name) });
}

/** Color sits behind readable neutral text; it never communicates selection or status. */
export function IdentityWash({
  name,
  placement,
}: {
  name: string;
  placement: 'card' | 'hero' | 'tag';
}) {
  return <Identity aria-hidden="true" tone={identityToneName(name)} wash={placement} />;
}
