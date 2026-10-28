import { ark } from '@ark-ui/react/factory';
import { forwardRef, type ComponentProps } from 'react';
import { styled } from '../../styled-system/jsx';
import { input } from '../../styled-system/recipes';

const BaseTextarea = styled(ark.textarea, input);

export type TextareaProps = Omit<ComponentProps<typeof BaseTextarea>, 'multiline'>;

/** The Input recipe on a textarea: field surface, control radius, grows with content. */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea(props, ref) {
    return <BaseTextarea {...props} ref={ref} multiline />;
  },
);
