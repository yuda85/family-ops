import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';

import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { FamilyService } from '../../../core/family/family.service';
import { CHILD_COLORS } from '../../../core/family/family.models';

@Component({
  selector: 'app-children',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatDialogModule,
    MatMenuModule,
    EmptyStateComponent,
  ],
  template: `
    <div class="children-page">
      <header class="page-header">
        <h1>הילדים</h1>
        <button mat-flat-button color="primary" (click)="showAddForm.set(true)">
          <mat-icon>add</mat-icon>
          הוסף ילד
        </button>
      </header>

      @if (showAddForm()) {
        <div class="add-child-form card">
          <h3>הוספת ילד חדש</h3>
          <form [formGroup]="childForm" (ngSubmit)="addChild()">
            <mat-form-field appearance="outline">
              <mat-label>שם הילד</mat-label>
              <input matInput formControlName="name" />
            </mat-form-field>

            <div class="color-picker">
              <label>בחר צבע</label>
              <div class="colors">
                @for (color of colors; track color) {
                  <button
                    type="button"
                    class="color-btn"
                    [style.background]="color"
                    [class.selected]="selectedColor() === color"
                    (click)="selectedColor.set(color)"
                  ></button>
                }
              </div>
            </div>

            <div class="form-actions">
              <button mat-button type="button" (click)="cancelAdd()">ביטול</button>
              <button
                mat-flat-button
                color="primary"
                type="submit"
                [disabled]="childForm.invalid || isSubmitting()"
              >
                הוסף
              </button>
            </div>
          </form>
        </div>
      }

      @if (familyService.children().length > 0) {
        <div class="children-grid">
          @for (child of familyService.sortedChildren(); track child.id) {
            <div class="child-card card">
              <div class="child-avatar" [style.background]="child.color">
                {{ child.name.charAt(0) }}
              </div>
              <div class="child-info">
                <h3>{{ child.name }}</h3>
                @if (child.birthYear) {
                  <span class="child-age">{{ getAge(child.birthYear) }}</span>
                }
              </div>
              <button mat-icon-button class="child-menu" [matMenuTriggerFor]="menu">
                <mat-icon>more_vert</mat-icon>
              </button>
              <mat-menu #menu="matMenu">
                <button mat-menu-item (click)="editChild(child)">
                  <mat-icon>edit</mat-icon>
                  <span>ערוך</span>
                </button>
                <button mat-menu-item (click)="deleteChild(child)">
                  <mat-icon>delete</mat-icon>
                  <span>מחק</span>
                </button>
              </mat-menu>
            </div>
          }
        </div>
      } @else if (!showAddForm()) {
        <app-empty-state
          icon="child_care"
          title="אין ילדים"
          description="הוסיפו את הילדים שלכם כדי לנהל אירועים והסעות"
          actionLabel="הוסף ילד"
          actionIcon="add"
          (action)="showAddForm.set(true)"
        ></app-empty-state>
      }
    </div>
  `,
  styles: [`
    .children-page {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;

      h1 {
        font-size: 1.5rem;
        font-weight: 700;
        margin: 0;
        color: var(--text-primary);
      }
    }

    .card {
      background: var(--surface-primary);
      border: 1px solid var(--border-subtle);
      border-radius: 1rem;
      padding: 1.5rem;
    }

    .add-child-form {
      h3 {
        margin: 0 0 1rem;
        font-size: 1.125rem;
        font-weight: 600;
      }

      form {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      mat-form-field {
        width: 100%;
      }

      .color-picker {
        label {
          display: block;
          margin-bottom: 0.5rem;
          font-size: 0.875rem;
          color: var(--text-secondary);
        }

        .colors {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .color-btn {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: 3px solid transparent;
          cursor: pointer;
          transition: all 0.15s ease;

          &:hover {
            transform: scale(1.1);
          }

          &.selected {
            border-color: var(--text-primary);
            box-shadow: 0 0 0 2px var(--surface-primary);
          }
        }
      }

      .form-actions {
        display: flex;
        justify-content: flex-end;
        gap: 0.75rem;
        margin-top: 0.5rem;
      }
    }

    .children-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1rem;
    }

    .child-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem 1.25rem;

      .child-avatar {
        width: 48px;
        height: 48px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.25rem;
        font-weight: 600;
        color: white;
      }

      .child-info {
        flex: 1;

        h3 {
          margin: 0;
          font-size: 1rem;
          font-weight: 600;
        }

        .child-age {
          font-size: 0.75rem;
          color: var(--text-secondary);
        }
      }

      .child-menu {
        color: var(--text-tertiary);
      }
    }
  `]
})
export class ChildrenComponent {
  private fb = inject(FormBuilder);
  familyService = inject(FamilyService);

  showAddForm = signal(false);
  isSubmitting = signal(false);
  selectedColor = signal(CHILD_COLORS[0]);
  colors = CHILD_COLORS;

  childForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
  });

  getAge(birthYear: number): string {
    const age = new Date().getFullYear() - birthYear;
    return `בן ${age}`;
  }

  async addChild(): Promise<void> {
    if (this.childForm.invalid) return;

    this.isSubmitting.set(true);
    try {
      await this.familyService.addChild({
        name: this.childForm.value.name,
        color: this.selectedColor(),
      });
      this.cancelAdd();
    } catch (err) {
      console.error('Error adding child:', err);
    } finally {
      this.isSubmitting.set(false);
    }
  }

  cancelAdd(): void {
    this.showAddForm.set(false);
    this.childForm.reset();
    this.selectedColor.set(CHILD_COLORS[0]);
  }

  editChild(child: any): void {
    // TODO: Implement edit
    console.log('Edit child:', child);
  }

  async deleteChild(child: any): Promise<void> {
    // TODO: Add confirmation dialog
    try {
      await this.familyService.deleteChild(child.id);
    } catch (err) {
      console.error('Error deleting child:', err);
    }
  }
}
