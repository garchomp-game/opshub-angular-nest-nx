import { Component, input, model, computed, output } from '@angular/core';

export interface SelectOption {
  value: string;
  label: string;
}

@Component({
  selector: 'app-select',
  standalone: true,
  template: `
    <fieldset class="fieldset w-full">
      @if (label()) {
        <label class="label font-medium">{{ label() }}</label>
      }
      <select class="select w-full"
          [class.select-sm]="size() === 'sm'"
          [value]="value()"
          (change)="onSelectionChange($event)">
        @if (placeholder()) {
          <option value="" disabled [selected]="!value()">{{ placeholder() }}</option>
        }
        @for (option of options(); track option.value) {
          <option [value]="option.value">{{ option.label }}</option>
        }
      </select>
    </fieldset>
  `,
})
export class AppSelectComponent {
  label = input<string>();
  placeholder = input<string>('選択してください');
  options = input.required<SelectOption[]>();
  value = model<string>('');
  size = input<'sm' | 'md'>('md');
  selectionChange = output<string>();

  onSelectionChange(event: Event): void {
    const val = (event.target as HTMLSelectElement).value;
    this.value.set(val);
    this.selectionChange.emit(val);
  }
}
