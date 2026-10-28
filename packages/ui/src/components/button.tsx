import { ark } from '@ark-ui/react/factory';
import { forwardRef, type ComponentProps } from 'react';
import { styled } from '../../styled-system/jsx';
import { button } from '../../styled-system/recipes';

const BaseButton = styled(ark.button, button);

export interface ButtonProps extends ComponentProps<typeof BaseButton> {
  /** Disables activation and exposes the pending operation to assistive technology. */
  loading?: boolean;
  loadingText?: string;
}

/** Park's native/Ark composition, with a smaller loading API for the foundation. */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { loading = false, loadingText = 'Working…', children, disabled, ...props },
  ref,
) {
  return (
    <BaseButton
      type="button"
      {...props}
      ref={ref}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      data-loading={loading ? '' : undefined}
    >
      {loading && !props.asChild ? loadingText : children}
    </BaseButton>
  );
});
