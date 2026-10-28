import { useEffect, useRef, useState, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { Icon, IconButton } from '@clipkit/ui';
import { css } from '@clipkit/ui/css';

/** Shared fixed action dock. Reserve its measured height so paging stays reachable. */
export function ManageBar({
  noun,
  onClose,
  children,
}: {
  noun: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const bar = useRef<HTMLElement>(null);
  const [height, setHeight] = useState(0);
  useEffect(() => {
    if (!bar.current) return;
    const observer = new ResizeObserver(([entry]) =>
      setHeight(entry.target.getBoundingClientRect().height),
    );
    observer.observe(bar.current);
    return () => observer.disconnect();
  }, []);
  return (
    <>
      <div aria-hidden="true" style={{ height: height + 32 }} />
      <section
        ref={bar}
        aria-label={`Manage ${noun}`}
        className={css({
          position: 'fixed',
          bottom: '4',
          left: { base: '4', lg: '[264px]' },
          right: '4',
          w: 'fit-content',
          maxW: { base: '[calc(100% - 32px)]', lg: '[calc(100% - 280px)]' },
          mx: 'auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexWrap: 'wrap',
          gap: '2',
          p: '3',
          bg: 'surface',
          borderWidth: '1px',
          borderColor: 'selectedLine',
          borderRadius: 'panel',
          boxShadow: 'lg',
          zIndex: 40,
          maxH: '[40dvh]',
          overflowY: 'auto',
        })}
      >
        {children}
        <IconButton
          variant="quiet"
          aria-label="Exit Manage mode"
          onClick={() => {
            onClose();
            requestAnimationFrame(() =>
              document.querySelector<HTMLButtonElement>('[data-manage-toggle]')?.focus(),
            );
          }}
        >
          <Icon glyph={X} size="sm" />
        </IconButton>
      </section>
    </>
  );
}
