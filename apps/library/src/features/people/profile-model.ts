import type { Account, CatalogueVideo, Person, PersonInfo } from '../../services/library-client';
export interface ProfileData {
  person: Person;
  info: PersonInfo;
  accounts: Account[];
  people: Person[];
  videos: CatalogueVideo[];
}
export function safeWebURL(value: string) {
  try {
    const url = new URL(value);
    return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password
      ? url.href
      : null;
  } catch {
    return null;
  }
}
