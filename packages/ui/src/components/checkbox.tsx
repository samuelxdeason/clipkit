import { Checkbox as ArkCheckbox } from '@ark-ui/react/checkbox';
import { Check, Minus } from 'lucide-react';
import { checkbox } from '../../styled-system/recipes';

export interface CheckboxProps {
  checked: boolean | 'indeterminate';
  onCheckedChange: (checked: boolean) => void;
  label: string;
  hideLabel?: boolean;
  disabled?: boolean;
  name?: string;
  value?: string;
}

/** Park/Ark checkbox composition with one rounded-square selection language. */
export function Checkbox({
  checked,
  onCheckedChange,
  label,
  hideLabel,
  disabled,
  name,
  value,
}: CheckboxProps) {
  const styles = checkbox({ hideLabel });
  return (
    <ArkCheckbox.Root
      checked={checked}
      disabled={disabled}
      name={name}
      value={value}
      onCheckedChange={(event) => onCheckedChange(event.checked === true)}
      className={styles.root}
    >
      <ArkCheckbox.Control className={styles.control}>
        <ArkCheckbox.Indicator indeterminate={checked === 'indeterminate'}>
          {checked === 'indeterminate' ? <Minus size={16} /> : <Check size={16} />}
        </ArkCheckbox.Indicator>
      </ArkCheckbox.Control>
      <ArkCheckbox.Label className={styles.label}>{label}</ArkCheckbox.Label>
      <ArkCheckbox.HiddenInput />
    </ArkCheckbox.Root>
  );
}
