import { AbstractControl, ValidatorFn } from '@angular/forms';

export function numberValidator(): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {
    const valid = !isNaN(control.value);
    return valid ? null : { 'notANumber': { value: control.value } };
  };
}