import { Component, inject, signal, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { ShoppingUnit, SHOPPING_UNITS, getUnitMeta } from '../../shopping.models';

export interface QuantityChange {
  quantity: number;
  unit: ShoppingUnit;
  estimatedPrice?: number;
}

@Component({
  selector: 'app-quantity-editor',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
  ],
  template: `
    <div class="quantity-editor" [class.inline]="mode === 'inline'" [class.popup]="mode === 'popup'">
      <div class="quantity-controls">
        <button
          mat-icon-button
          class="qty-btn decrease"
          (click)="decrease()"
          [disabled]="currentQuantity() <= minQuantity"
        >
          <mat-icon>remove</mat-icon>
        </button>

        <div class="quantity-value">
          <input
            type="number"
            [ngModel]="currentQuantity()"
            (ngModelChange)="onQuantityInput($event)"
            [min]="minQuantity"
            [max]="maxQuantity"
            [step]="step"
            class="qty-input"
          />
        </div>

        <button mat-icon-button class="qty-btn increase" (click)="increase()">
          <mat-icon>add</mat-icon>
        </button>
      </div>

      <mat-form-field appearance="outline" class="unit-select">
        <mat-select [ngModel]="currentUnit()" (ngModelChange)="onUnitChange($event)">
          @for (unit of units; track unit.id) {
            <mat-option [value]="unit.id">{{ unit.shortHe }}</mat-option>
          }
        </mat-select>
      </mat-form-field>

      @if (showPrice) {
        <mat-form-field appearance="outline" class="price-field">
          <span matPrefix>₪</span>
          <input
            matInput
            type="number"
            placeholder="מחיר"
            [ngModel]="currentPrice()"
            (ngModelChange)="onPriceChange($event)"
            [min]="0"
          />
        </mat-form-field>
      }

      @if (mode === 'popup') {
        <div class="popup-actions">
          <button mat-button (click)="cancel()">ביטול</button>
          <button mat-flat-button color="primary" (click)="save()">שמור</button>
        </div>
      }
    </div>
  `,
  styles: [`
    .quantity-editor {
      display: flex;
      align-items: center;
      gap: 0.75rem;

      &.inline {
        .quantity-controls {
          background: var(--surface-secondary);
        }
      }

      &.popup {
        flex-direction: column;
        padding: 1rem;
        background: var(--surface-primary);
        border-radius: 1rem;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
      }
    }

    .quantity-controls {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      padding: 0.25rem;
      border-radius: 0.5rem;
      background: var(--surface-secondary);
    }

    .qty-btn {
      width: 36px;
      height: 36px;

      &.decrease {
        color: var(--color-error);
      }

      &.increase {
        color: var(--color-success);
      }

      &:disabled {
        opacity: 0.4;
      }
    }

    .quantity-value {
      min-width: 50px;
      text-align: center;
    }

    .qty-input {
      width: 50px;
      text-align: center;
      border: none;
      background: transparent;
      font-size: 1rem;
      font-weight: 600;
      color: var(--text-primary);

      &:focus {
        outline: none;
      }

      /* Hide spinners */
      -moz-appearance: textfield;
      &::-webkit-outer-spin-button,
      &::-webkit-inner-spin-button {
        -webkit-appearance: none;
        margin: 0;
      }
    }

    .unit-select {
      width: 90px;

      ::ng-deep {
        .mat-mdc-form-field-subscript-wrapper {
          display: none;
        }

        .mat-mdc-select-value {
          font-size: 0.875rem;
        }
      }
    }

    .price-field {
      width: 100px;

      ::ng-deep {
        .mat-mdc-form-field-subscript-wrapper {
          display: none;
        }

        .mat-mdc-form-field-text-prefix {
          padding-inline-end: 0.25rem;
        }

        input {
          text-align: center;
        }
      }
    }

    .popup-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
      width: 100%;
      margin-top: 0.5rem;
      padding-top: 0.75rem;
      border-top: 1px solid var(--border-subtle);
    }
  `]
})
export class QuantityEditorComponent {
  @Input() quantity = 1;
  @Input() unit: ShoppingUnit = 'units';
  @Input() price = 0;
  @Input() showPrice = false;
  @Input() mode: 'inline' | 'popup' = 'inline';
  @Input() minQuantity = 0.5;
  @Input() maxQuantity = 999;
  @Input() step = 0.5;

  @Output() quantityChanged = new EventEmitter<QuantityChange>();
  @Output() cancelled = new EventEmitter<void>();

  units = SHOPPING_UNITS;

  currentQuantity = signal(1);
  currentUnit = signal<ShoppingUnit>('units');
  currentPrice = signal(0);

  ngOnInit(): void {
    this.currentQuantity.set(this.quantity);
    this.currentUnit.set(this.unit);
    this.currentPrice.set(this.price);
  }

  ngOnChanges(): void {
    this.currentQuantity.set(this.quantity);
    this.currentUnit.set(this.unit);
    this.currentPrice.set(this.price);
  }

  increase(): void {
    const newValue = Math.min(this.currentQuantity() + this.step, this.maxQuantity);
    this.currentQuantity.set(newValue);
    this.emitChange();
  }

  decrease(): void {
    const newValue = Math.max(this.currentQuantity() - this.step, this.minQuantity);
    this.currentQuantity.set(newValue);
    this.emitChange();
  }

  onQuantityInput(value: number): void {
    const clamped = Math.max(this.minQuantity, Math.min(value, this.maxQuantity));
    this.currentQuantity.set(clamped);
    this.emitChange();
  }

  onUnitChange(unit: ShoppingUnit): void {
    this.currentUnit.set(unit);
    this.emitChange();
  }

  onPriceChange(price: number): void {
    this.currentPrice.set(Math.max(0, price));
    this.emitChange();
  }

  private emitChange(): void {
    if (this.mode === 'inline') {
      this.quantityChanged.emit({
        quantity: this.currentQuantity(),
        unit: this.currentUnit(),
        estimatedPrice: this.showPrice ? this.currentPrice() : undefined,
      });
    }
  }

  save(): void {
    this.quantityChanged.emit({
      quantity: this.currentQuantity(),
      unit: this.currentUnit(),
      estimatedPrice: this.showPrice ? this.currentPrice() : undefined,
    });
  }

  cancel(): void {
    this.cancelled.emit();
  }
}
