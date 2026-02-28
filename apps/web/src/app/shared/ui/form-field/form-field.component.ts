import { Component, input } from '@angular/core';

@Component({
  selector: 'app-form-field',
  standalone: true,
  template: `
    <fieldset class="fieldset w-full">
      @if (label()) {
        <label class="label font-medium">
          {{ label() }}
          @if (required()) {
            <span class="text-error ml-1">*</span>
          }
        </label>
      }

      <ng-content />

      @if (errorMessage()) {
        <p class="label text-error text-sm">{{ errorMessage() }}</p>
      }
      @if (hint()) {
        <p class="label text-base-content/50 text-sm">{{ hint() }}</p>
      }
    </fieldset>
  `,
})
export class FormFieldComponent {
  label = input<string>();
  required = input(false);
  errorMessage = input<string>();
  hint = input<string>();
}
