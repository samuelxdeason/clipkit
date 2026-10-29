export type SettingsSection = 'general' | 'connections' | 'maintenance';

/** The existing app's three sections that have daemon-backed behaviour. */
export const sections: {
  id: SettingsSection;
  label: string;
  detail: string;
  title: string;
  description: string;
}[] = [
  {
    id: 'general',
    label: 'Library',
    detail: 'Location & storage',
    title: 'Your library',
    description: 'Storage and library information, in one place.',
  },
  {
    id: 'connections',
    label: 'Connections',
    detail: 'Accounts & access',
    title: 'Connections',
    description: 'Manage access to the services you save from.',
  },
  {
    id: 'maintenance',
    label: 'Maintenance',
    detail: 'Backup & media care',
    title: 'Maintenance',
    description: 'Keep your catalogue backed up and your media ready to play.',
  },
];

/** The existing app's storage figure: gigabytes to one place, else whole megabytes. */
export function bytes(value = 0) {
  return value >= 1073741824
    ? `${(value / 1073741824).toFixed(1)} GB`
    : `${Math.round(value / 1048576)} MB`;
}
