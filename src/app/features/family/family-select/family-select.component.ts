import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';

import { AuthService } from '../../../core/auth/auth.service';
import { FamilyService } from '../../../core/family/family.service';
import { ThemeService } from '../../../core/theme/theme.service';

type ViewMode = 'select' | 'create' | 'join';

@Component({
  selector: 'app-family-select',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatDividerModule,
  ],
  template: `
    <div class="family-select-page">
      <div class="family-select-container">
        <!-- Theme toggle -->
        <button
          class="theme-toggle"
          (click)="themeService.cycleTheme()"
          [attr.aria-label]="'ערכת נושא: ' + themeService.getThemeLabel()"
        >
          <mat-icon>{{ themeService.getThemeIcon() }}</mat-icon>
        </button>

        <div class="family-select-card">
          <div class="card-header">
            <span class="logo">👨‍👩‍👧‍👦</span>
            <h1>
              @switch (viewMode()) {
                @case ('select') { בחירת משפחה }
                @case ('create') { יצירת משפחה חדשה }
                @case ('join') { הצטרפות למשפחה }
              }
            </h1>
          </div>

          @switch (viewMode()) {
            <!-- Family Selection View -->
            @case ('select') {
              @if (hasFamilies()) {
                <div class="families-list">
                  @for (family of getFamilies(); track family.familyId) {
                    <button
                      class="family-item"
                      (click)="selectFamily(family.familyId)"
                      [class.active]="authService.activeFamilyId() === family.familyId"
                    >
                      <div class="family-avatar">
                        {{ family.familyId.substring(0, 2).toUpperCase() }}
                      </div>
                      <div class="family-info">
                        <span class="family-name">{{ family.familyId }}</span>
                        <span class="family-role">{{ getRoleLabel(family.role) }}</span>
                      </div>
                      <mat-icon class="chevron">chevron_left</mat-icon>
                    </button>
                  }
                </div>
              } @else {
                <div class="empty-state">
                  <mat-icon>family_restroom</mat-icon>
                  <p>אין לך משפחות עדיין</p>
                  <p class="hint">צרו משפחה חדשה או הצטרפו למשפחה קיימת</p>
                </div>
              }

              <mat-divider></mat-divider>

              <div class="actions">
                <button mat-flat-button color="primary" (click)="viewMode.set('create')">
                  <mat-icon>add</mat-icon>
                  צור משפחה חדשה
                </button>
                <button mat-stroked-button (click)="viewMode.set('join')">
                  <mat-icon>group_add</mat-icon>
                  הצטרף למשפחה
                </button>
              </div>
            }

            <!-- Create Family View -->
            @case ('create') {
              <form [formGroup]="createForm" (ngSubmit)="createFamily()" class="form">
                <mat-form-field appearance="outline">
                  <mat-label>שם המשפחה</mat-label>
                  <input matInput formControlName="name" />
                  <mat-icon matPrefix>badge</mat-icon>
                  @if (createForm.get('name')?.hasError('required') && createForm.get('name')?.touched) {
                    <mat-error>נא להזין שם</mat-error>
                  }
                </mat-form-field>

                @if (error()) {
                  <div class="error-message">
                    <mat-icon>error</mat-icon>
                    <span>{{ error() }}</span>
                  </div>
                }

                <div class="form-actions">
                  <button mat-button type="button" (click)="viewMode.set('select')">
                    חזרה
                  </button>
                  <button
                    mat-flat-button
                    color="primary"
                    type="submit"
                    [disabled]="createForm.invalid || isLoading()"
                  >
                    @if (isLoading()) {
                      <mat-spinner diameter="20"></mat-spinner>
                    } @else {
                      יצירת משפחה
                    }
                  </button>
                </div>
              </form>
            }

            <!-- Join Family View -->
            @case ('join') {
              <form [formGroup]="joinForm" (ngSubmit)="joinFamily()" class="form">
                <mat-form-field appearance="outline">
                  <mat-label>קוד הזמנה</mat-label>
                  <input matInput formControlName="inviteCode" dir="ltr" />
                  <mat-icon matPrefix>vpn_key</mat-icon>
                  @if (joinForm.get('inviteCode')?.hasError('required') && joinForm.get('inviteCode')?.touched) {
                    <mat-error>נא להזין קוד הזמנה</mat-error>
                  }
                </mat-form-field>

                <p class="hint-text">הזינו את קוד ההזמנה שקיבלתם מאחד מבני המשפחה</p>

                @if (error()) {
                  <div class="error-message">
                    <mat-icon>error</mat-icon>
                    <span>{{ error() }}</span>
                  </div>
                }

                <div class="form-actions">
                  <button mat-button type="button" (click)="viewMode.set('select')">
                    חזרה
                  </button>
                  <button
                    mat-flat-button
                    color="primary"
                    type="submit"
                    [disabled]="joinForm.invalid || isLoading()"
                  >
                    @if (isLoading()) {
                      <mat-spinner diameter="20"></mat-spinner>
                    } @else {
                      הצטרפות
                    }
                  </button>
                </div>
              </form>
            }
          }
        </div>

        <button mat-button class="logout-button" (click)="logout()">
          <mat-icon>logout</mat-icon>
          התנתקות
        </button>
      </div>
    </div>
  `,
  styles: [`
    .family-select-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--surface-app);
      padding: 1rem;
    }

    .family-select-container {
      width: 100%;
      max-width: 420px;
      position: relative;
    }

    .theme-toggle {
      position: absolute;
      top: -3rem;
      left: 0;
      background: var(--surface-primary);
      border: 1px solid var(--border-default);
      border-radius: 50%;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s ease;

      mat-icon {
        color: var(--text-secondary);
      }

      &:hover {
        background: var(--surface-hover);
      }
    }

    .family-select-card {
      background: var(--surface-primary);
      border-radius: 1.5rem;
      padding: 2rem;
      box-shadow: var(--shadow-lg);
      border: 1px solid var(--border-subtle);
    }

    .card-header {
      text-align: center;
      margin-bottom: 1.5rem;

      .logo {
        font-size: 2.5rem;
        display: block;
        margin-bottom: 0.75rem;
      }

      h1 {
        font-size: 1.5rem;
        font-weight: 700;
        color: var(--text-primary);
        margin: 0;
      }
    }

    .families-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      margin-bottom: 1.5rem;
    }

    .family-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background: var(--surface-secondary);
      border: 1px solid var(--border-default);
      border-radius: 1rem;
      cursor: pointer;
      transition: all 0.2s ease;
      width: 100%;
      text-align: right;

      &:hover {
        background: var(--surface-hover);
        border-color: var(--border-strong);
      }

      &.active {
        border-color: var(--color-primary);
        background: var(--color-primary-alpha);
      }
    }

    .family-avatar {
      width: 48px;
      height: 48px;
      border-radius: var(--radius-lg);
      background: var(--color-primary);
      color: var(--text-on-primary);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: var(--font-weight-semibold);
      font-size: var(--font-size-base);
    }

    .family-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .family-name {
      font-weight: 600;
      color: var(--text-primary);
    }

    .family-role {
      font-size: 0.75rem;
      color: var(--text-secondary);
    }

    .chevron {
      color: var(--text-tertiary);
    }

    .empty-state {
      text-align: center;
      padding: 2rem 1rem;
      color: var(--text-secondary);

      mat-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
        color: var(--text-tertiary);
        margin-bottom: 1rem;
      }

      p {
        margin: 0;
        &.hint {
          font-size: 0.875rem;
          color: var(--text-tertiary);
          margin-top: 0.5rem;
        }
      }
    }

    mat-divider {
      margin: 1.5rem 0;
    }

    .actions {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;

      button {
        height: 48px;
        font-size: 1rem;

        mat-icon {
          margin-inline-end: 0.5rem;
        }
      }
    }

    .form {
      display: flex;
      flex-direction: column;
      gap: 1rem;

      mat-form-field {
        width: 100%;
      }
    }

    .hint-text {
      font-size: 0.875rem;
      color: var(--text-secondary);
      margin: 0;
    }

    .error-message {
      display: flex;
      align-items: center;
      gap: var(--spacing-2);
      padding: var(--spacing-3) var(--spacing-4);
      background: var(--error-bg);
      color: var(--color-error);
      border-radius: var(--radius-lg);
      font-size: var(--font-size-sm);

      mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
      }
    }

    .form-actions {
      display: flex;
      justify-content: space-between;
      gap: 1rem;
      margin-top: 0.5rem;

      button[type="submit"] {
        flex: 1;
      }
    }

    .logout-button {
      display: flex;
      margin: 1.5rem auto 0;
      color: var(--text-secondary);

      mat-icon {
        margin-inline-end: 0.5rem;
      }
    }
  `]
})
export class FamilySelectComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  authService = inject(AuthService);
  familyService = inject(FamilyService);
  themeService = inject(ThemeService);

  viewMode = signal<ViewMode>('select');
  isLoading = signal(false);
  error = signal<string | null>(null);

  createForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
  });

  joinForm: FormGroup = this.fb.group({
    inviteCode: ['', [Validators.required]],
  });

  ngOnInit(): void {
    // Check for invite code in URL
    const inviteCode = this.route.snapshot.queryParams['invite'];
    if (inviteCode) {
      this.joinForm.patchValue({ inviteCode });
      this.viewMode.set('join');
    }
  }

  hasFamilies(): boolean {
    const user = this.authService.user();
    return user ? Object.keys(user.familyMemberships).length > 0 : false;
  }

  getFamilies(): Array<{ familyId: string; role: string }> {
    const user = this.authService.user();
    if (!user) return [];

    return Object.entries(user.familyMemberships).map(([familyId, role]) => ({
      familyId,
      role,
    }));
  }

  getRoleLabel(role: string): string {
    const labels: Record<string, string> = {
      owner: 'בעלים',
      admin: 'מנהל',
      member: 'חבר',
      viewer: 'צופה',
    };
    return labels[role] ?? role;
  }

  async selectFamily(familyId: string): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      await this.authService.setActiveFamily(familyId);
      await this.familyService.loadFamily(familyId);
      this.router.navigate(['/app']);
    } catch (err: any) {
      this.error.set(err.message || 'שגיאה בטעינת המשפחה');
    } finally {
      this.isLoading.set(false);
    }
  }

  async createFamily(): Promise<void> {
    if (this.createForm.invalid) return;

    this.isLoading.set(true);
    this.error.set(null);

    try {
      const familyId = await this.familyService.createFamily({
        name: this.createForm.value.name,
      });
      await this.authService.setActiveFamily(familyId);
      await this.familyService.loadFamily(familyId);
      this.router.navigate(['/app']);
    } catch (err: any) {
      this.error.set(err.message || 'שגיאה ביצירת המשפחה');
    } finally {
      this.isLoading.set(false);
    }
  }

  async joinFamily(): Promise<void> {
    if (this.joinForm.invalid) return;

    this.isLoading.set(true);
    this.error.set(null);

    try {
      const familyId = await this.familyService.acceptInvite(
        this.joinForm.value.inviteCode
      );
      await this.authService.setActiveFamily(familyId);
      await this.familyService.loadFamily(familyId);
      this.router.navigate(['/app']);
    } catch (err: any) {
      this.error.set(err.message || 'שגיאה בהצטרפות למשפחה');
    } finally {
      this.isLoading.set(false);
    }
  }

  async logout(): Promise<void> {
    await this.authService.logout();
    this.router.navigate(['/auth/login']);
  }
}
