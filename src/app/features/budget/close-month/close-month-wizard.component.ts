import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { BudgetService } from '../budget.service';
import {
  CloseMonthEntry,
  formatMonthLabel,
  formatAmount,
  getCurrentYearMonth,
  getExpenseTypeMeta,
} from '../budget.models';

type WizardStep = 'welcome' | 'variables' | 'occasional' | 'summary' | 'celebration';

@Component({
  selector: 'app-close-month-wizard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  template: `
    <div class="wizard-container" [attr.data-step]="currentStep()">
      <!-- Animated Background -->
      <div class="wizard-background">
        <div class="bg-orb bg-orb-1"></div>
        <div class="bg-orb bg-orb-2"></div>
        <div class="bg-orb bg-orb-3"></div>
      </div>

      <!-- Progress Bar -->
      @if (currentStep() !== 'celebration') {
        <div class="progress-track">
          <div class="progress-fill" [style.width.%]="progressPercent()"></div>
          <div class="progress-steps">
            @for (step of steps; track step.id; let i = $index) {
              <div
                class="progress-step"
                [class.active]="isStepActive(step.id)"
                [class.completed]="isStepCompleted(step.id)"
              >
                <div class="step-dot">
                  @if (isStepCompleted(step.id)) {
                    <mat-icon>check</mat-icon>
                  }
                </div>
                <span class="step-label">{{ step.label }}</span>
              </div>
            }
          </div>
        </div>
      }

      <!-- Step Content -->
      <div class="step-content" [class.celebration-mode]="currentStep() === 'celebration'">

        <!-- WELCOME STEP -->
        @if (currentStep() === 'welcome') {
          <div class="welcome-step animate-in">
            <div class="welcome-illustration">
              <div class="calendar-icon">
                <mat-icon>event_available</mat-icon>
              </div>
              <div class="sparkles">
                <span class="sparkle s1">✦</span>
                <span class="sparkle s2">✧</span>
                <span class="sparkle s3">✦</span>
              </div>
            </div>

            <h1 class="welcome-title">הגיע הזמן לסגור את</h1>
            <h2 class="month-title">{{ currentMonthLabel }}</h2>

            <p class="welcome-desc">
              בואו נעדכן את ההוצאות בפועל ונראה איך עמדנו ביעדים
            </p>

            <div class="summary-preview">
              <div class="preview-card">
                <div class="preview-icon fixed">
                  <mat-icon>lock</mat-icon>
                </div>
                <div class="preview-info">
                  <span class="preview-label">הוצאות קבועות</span>
                  <span class="preview-value">{{ formatAmount(fixedTotal()) }}</span>
                </div>
              </div>
              <div class="preview-card">
                <div class="preview-icon variable">
                  <mat-icon>trending_up</mat-icon>
                </div>
                <div class="preview-info">
                  <span class="preview-label">הוצאות משתנות</span>
                  <span class="preview-value">{{ variableEntries().length }} קטגוריות</span>
                </div>
              </div>
              <div class="preview-card">
                <div class="preview-icon occasional">
                  <mat-icon>shopping_bag</mat-icon>
                </div>
                <div class="preview-info">
                  <span class="preview-label">הוצאות חד פעמיות</span>
                  <span class="preview-value">{{ formatAmount(occasionalTotal()) }}</span>
                </div>
              </div>
            </div>

            <button mat-flat-button class="cta-button" (click)="nextStep()">
              <span>בואו נתחיל</span>
              <mat-icon>arrow_back</mat-icon>
            </button>
          </div>
        }

        <!-- VARIABLE CATEGORIES STEP -->
        @if (currentStep() === 'variables') {
          <div class="variables-step animate-in">
            @if (currentVariableEntry(); as entry) {
              <div class="entry-counter">
                <span>{{ currentVariableIndex() + 1 }}</span>
                <span class="separator">/</span>
                <span>{{ variableEntries().length }}</span>
              </div>

              <div class="category-card">
                <div
                  class="category-header"
                  [style.--category-color]="entry.categoryColor"
                >
                  <div class="category-icon-wrapper">
                    <mat-icon>{{ entry.categoryIcon }}</mat-icon>
                  </div>
                  <h2 class="category-name">{{ entry.categoryLabel }}</h2>
                </div>

                <div class="category-body">
                  <div class="target-info">
                    <span class="target-label">יעד חודשי</span>
                    <span class="target-value">{{ formatAmount(entry.plannedAmount) }}</span>
                  </div>

                  <div class="suggestion-section">
                    <div class="suggestion-header">
                      <mat-icon>lightbulb</mat-icon>
                      <span>הצעה חכמה</span>
                    </div>
                    <div class="suggestion-value">
                      {{ formatAmount(entry.suggestedAmount) }}
                    </div>
                    <div class="suggestion-source">
                      @switch (entry.suggestionSource) {
                        @case ('last_month') {
                          <mat-icon>history</mat-icon>
                          <span>לפי חודש שעבר</span>
                        }
                        @case ('three_month_avg') {
                          <mat-icon>analytics</mat-icon>
                          <span>ממוצע 3 חודשים</span>
                        }
                        @case ('shopping') {
                          <mat-icon>shopping_cart</mat-icon>
                          <span>לפי קניות</span>
                        }
                        @default {
                          <mat-icon>edit</mat-icon>
                          <span>הזנה ידנית</span>
                        }
                      }
                    </div>
                  </div>

                  <div class="input-section">
                    <label class="input-label">סכום בפועל</label>
                    <div class="amount-input-wrapper">
                      <span class="currency">₪</span>
                      <input
                        type="number"
                        class="amount-input"
                        [(ngModel)]="entry.actualAmount"
                        min="0"
                        step="10"
                        (focus)="onInputFocus($event)"
                      >
                    </div>
                  </div>

                  <div class="quick-actions">
                    @if (entry.lastMonthActual) {
                      <button
                        mat-stroked-button
                        class="quick-action"
                        (click)="setAmount(entry, entry.lastMonthActual!)"
                      >
                        <mat-icon>history</mat-icon>
                        כמו בחודש שעבר ({{ formatAmount(entry.lastMonthActual) }})
                      </button>
                    }
                    <button
                      mat-stroked-button
                      class="quick-action"
                      (click)="setAmount(entry, entry.suggestedAmount)"
                    >
                      <mat-icon>auto_awesome</mat-icon>
                      קבל הצעה
                    </button>
                  </div>
                </div>
              </div>

              <div class="navigation-buttons">
                <button
                  mat-button
                  class="nav-btn prev"
                  (click)="prevVariableEntry()"
                  [disabled]="currentVariableIndex() === 0"
                >
                  <mat-icon>arrow_forward</mat-icon>
                  הקודם
                </button>
                <button
                  mat-flat-button
                  class="nav-btn next"
                  (click)="nextVariableEntry()"
                >
                  @if (isLastVariable()) {
                    המשך לסיכום
                  } @else {
                    הבא
                  }
                  <mat-icon>arrow_back</mat-icon>
                </button>
              </div>
            }
          </div>
        }

        <!-- OCCASIONAL REVIEW STEP -->
        @if (currentStep() === 'occasional') {
          <div class="occasional-step animate-in">
            <div class="step-header">
              <div class="step-icon occasional">
                <mat-icon>shopping_bag</mat-icon>
              </div>
              <h2>הוצאות חד פעמיות</h2>
              <p>סקירת כל ההוצאות החד פעמיות החודש</p>
            </div>

            @if (occasionalExpenses().length > 0) {
              <div class="occasional-list">
                @for (expense of occasionalExpenses(); track expense.id) {
                  <div class="occasional-item">
                    <div class="item-icon" [style.background]="getCategoryBg(expense.category)">
                      <mat-icon [style.color]="getCategoryColor(expense.category)">
                        {{ getCategoryIcon(expense.category) }}
                      </mat-icon>
                    </div>
                    <div class="item-info">
                      <span class="item-desc">{{ expense.description }}</span>
                      <span class="item-date">{{ formatDate(expense.date) }}</span>
                    </div>
                    <span class="item-amount">{{ formatAmount(expense.amount) }}</span>
                  </div>
                }
              </div>
              <div class="occasional-total">
                <span class="total-label">סה"כ חד פעמיות</span>
                <span class="total-value">{{ formatAmount(occasionalTotal()) }}</span>
              </div>
            } @else {
              <div class="no-occasional">
                <mat-icon>check_circle</mat-icon>
                <p>לא נרשמו הוצאות חד פעמיות החודש</p>
              </div>
            }

            <button mat-stroked-button class="add-expense-btn" routerLink="../occasional">
              <mat-icon>add</mat-icon>
              הוסף הוצאה שנשכחה
            </button>

            <div class="navigation-buttons">
              <button mat-button class="nav-btn prev" (click)="prevStep()">
                <mat-icon>arrow_forward</mat-icon>
                חזרה
              </button>
              <button mat-flat-button class="nav-btn next" (click)="nextStep()">
                לסיכום
                <mat-icon>arrow_back</mat-icon>
              </button>
            </div>
          </div>
        }

        <!-- SUMMARY STEP -->
        @if (currentStep() === 'summary') {
          <div class="summary-step animate-in">
            <div class="summary-header">
              <h2>סיכום {{ currentMonthLabel }}</h2>
              <p>בואו נראה את התמונה המלאה</p>
            </div>

            <div class="summary-breakdown">
              <!-- Fixed -->
              <div class="breakdown-section">
                <div class="section-header">
                  <div class="section-icon fixed">
                    <mat-icon>lock</mat-icon>
                  </div>
                  <span class="section-title">קבוע חודשי</span>
                  <span class="section-total">{{ formatAmount(fixedTotal()) }}</span>
                </div>
              </div>

              <!-- Variable -->
              <div class="breakdown-section">
                <div class="section-header">
                  <div class="section-icon variable">
                    <mat-icon>trending_up</mat-icon>
                  </div>
                  <span class="section-title">משתנה חודשי</span>
                  <span class="section-total">{{ formatAmount(variableTotalActual()) }}</span>
                </div>
                <div class="section-details">
                  @for (entry of variableEntries(); track entry.category) {
                    <div class="detail-row">
                      <span class="detail-label">{{ entry.categoryLabel }}</span>
                      <span class="detail-value" [class.over]="entry.actualAmount > entry.plannedAmount">
                        {{ formatAmount(entry.actualAmount) }}
                      </span>
                    </div>
                  }
                </div>
              </div>

              <!-- Occasional -->
              <div class="breakdown-section">
                <div class="section-header">
                  <div class="section-icon occasional">
                    <mat-icon>shopping_bag</mat-icon>
                  </div>
                  <span class="section-title">חד פעמי</span>
                  <span class="section-total">{{ formatAmount(occasionalTotal()) }}</span>
                </div>
              </div>
            </div>

            <div class="grand-total" [class.over]="grandTotal() > totalPlanned()">
              <div class="total-row">
                <span class="total-label">סה"כ</span>
                <span class="total-amount">{{ formatAmount(grandTotal()) }}</span>
              </div>
              <div class="planned-row">
                <span>יעד: {{ formatAmount(totalPlanned()) }}</span>
                <span class="diff" [class.positive]="grandTotal() <= totalPlanned()">
                  {{ grandTotal() <= totalPlanned() ? 'במסגרת ✓' : 'חריגה של ' + formatAmount(grandTotal() - totalPlanned()) }}
                </span>
              </div>
            </div>

            <div class="navigation-buttons">
              <button mat-button class="nav-btn prev" (click)="prevStep()">
                <mat-icon>arrow_forward</mat-icon>
                חזרה
              </button>
              <button
                mat-flat-button
                class="nav-btn finish"
                (click)="closeMonth()"
                [disabled]="isClosing()"
              >
                @if (isClosing()) {
                  <mat-spinner diameter="20"></mat-spinner>
                } @else {
                  <mat-icon>check_circle</mat-icon>
                  אשר וסגור חודש
                }
              </button>
            </div>
          </div>
        }

        <!-- CELEBRATION STEP -->
        @if (currentStep() === 'celebration') {
          <div class="celebration-step">
            <!-- Confetti -->
            <div class="confetti-container">
              @for (i of confettiPieces; track i) {
                <div
                  class="confetti-piece"
                  [style.--delay]="i * 0.05 + 's'"
                  [style.--x]="getRandomX(i)"
                  [style.--rotation]="getRandomRotation(i)"
                  [style.--color]="getConfettiColor(i)"
                ></div>
              }
            </div>

            <div class="celebration-content animate-in">
              <div class="trophy-container">
                <div class="trophy">
                  <mat-icon>emoji_events</mat-icon>
                </div>
                <div class="trophy-glow"></div>
              </div>

              <h1 class="celebration-title">כל הכבוד!</h1>
              <p class="celebration-subtitle">{{ currentMonthLabel }} נסגר בהצלחה</p>

              <div class="final-stats">
                <div class="stat">
                  <span class="stat-value">{{ formatAmount(grandTotal()) }}</span>
                  <span class="stat-label">סה"כ הוצאות</span>
                </div>
                <div class="stat-divider"></div>
                <div class="stat" [class.positive]="grandTotal() <= totalPlanned()">
                  <span class="stat-value">
                    {{ grandTotal() <= totalPlanned() ? '✓' : formatAmount(grandTotal() - totalPlanned()) }}
                  </span>
                  <span class="stat-label">
                    {{ grandTotal() <= totalPlanned() ? 'במסגרת התקציב' : 'חריגה' }}
                  </span>
                </div>
              </div>

              <button mat-flat-button class="done-button" routerLink="../">
                <mat-icon>home</mat-icon>
                חזרה לדשבורד
              </button>
            </div>
          </div>
        }
      </div>

      <!-- Close Button -->
      @if (currentStep() !== 'celebration') {
        <button mat-icon-button class="close-wizard" routerLink="../">
          <mat-icon>close</mat-icon>
        </button>
      }
    </div>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Rubik:wght@400;500;600;700&display=swap');

    :host {
      display: block;
      min-height: 100vh;
      font-family: 'Rubik', sans-serif;
    }

    .wizard-container {
      position: relative;
      min-height: 100vh;
      overflow: hidden;
      background: linear-gradient(135deg, #fef9f3 0%, #fff5eb 50%, #fef0e4 100%);
    }

    /* Background Orbs */
    .wizard-background {
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: 0;
    }

    .bg-orb {
      position: absolute;
      border-radius: 50%;
      filter: blur(80px);
      opacity: 0.5;
      animation: float 20s ease-in-out infinite;
    }

    .bg-orb-1 {
      width: 400px;
      height: 400px;
      background: linear-gradient(135deg, #ffd8a8, #ffc078);
      top: -100px;
      right: -100px;
      animation-delay: 0s;
    }

    .bg-orb-2 {
      width: 300px;
      height: 300px;
      background: linear-gradient(135deg, #a5d8ff, #74c0fc);
      bottom: 10%;
      left: -50px;
      animation-delay: -7s;
    }

    .bg-orb-3 {
      width: 250px;
      height: 250px;
      background: linear-gradient(135deg, #b2f2bb, #8ce99a);
      top: 50%;
      right: 20%;
      animation-delay: -14s;
    }

    @keyframes float {
      0%, 100% { transform: translate(0, 0) scale(1); }
      33% { transform: translate(30px, -30px) scale(1.05); }
      66% { transform: translate(-20px, 20px) scale(0.95); }
    }

    /* Progress Track */
    .progress-track {
      position: relative;
      padding: 1.5rem 2rem;
      z-index: 10;
    }

    .progress-fill {
      position: absolute;
      top: 50%;
      right: 2rem;
      height: 4px;
      background: linear-gradient(90deg, #ff922b, #fab005);
      border-radius: 2px;
      transform: translateY(-50%);
      transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
      z-index: 0;
    }

    .progress-steps {
      display: flex;
      justify-content: space-between;
      position: relative;
      z-index: 1;
    }

    .progress-step {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
    }

    .step-dot {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: white;
      border: 3px solid #e9ecef;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s ease;

      mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
        color: white;
      }
    }

    .progress-step.active .step-dot {
      border-color: #ff922b;
      background: #ff922b;
      box-shadow: 0 0 0 4px rgba(255, 146, 43, 0.2);
    }

    .progress-step.completed .step-dot {
      border-color: #40c057;
      background: #40c057;
    }

    .step-label {
      font-size: 0.75rem;
      color: var(--text-tertiary, #868e96);
      font-weight: 500;

      @media (max-width: 600px) {
        display: none;
      }
    }

    .progress-step.active .step-label,
    .progress-step.completed .step-label {
      color: var(--text-primary, #212529);
    }

    /* Step Content */
    .step-content {
      position: relative;
      z-index: 10;
      padding: 1rem 1.5rem 3rem;
      max-width: 500px;
      margin: 0 auto;
    }

    .step-content.celebration-mode {
      max-width: 100%;
      padding: 0;
    }

    /* Animations */
    .animate-in {
      animation: slideUp 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
    }

    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    /* Welcome Step */
    .welcome-step {
      text-align: center;
    }

    .welcome-illustration {
      position: relative;
      display: inline-block;
      margin-bottom: 1.5rem;
    }

    .calendar-icon {
      width: 100px;
      height: 100px;
      background: linear-gradient(135deg, #ff922b, #fab005);
      border-radius: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 20px 40px rgba(255, 146, 43, 0.3);

      mat-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
        color: white;
      }
    }

    .sparkles {
      position: absolute;
      inset: -20px;
      pointer-events: none;
    }

    .sparkle {
      position: absolute;
      font-size: 1.5rem;
      animation: sparkle 2s ease-in-out infinite;
    }

    .sparkle.s1 { top: 0; left: 0; color: #ff922b; animation-delay: 0s; }
    .sparkle.s2 { top: -10px; right: 10px; color: #fab005; animation-delay: 0.5s; }
    .sparkle.s3 { bottom: 10px; right: -10px; color: #fcc419; animation-delay: 1s; }

    @keyframes sparkle {
      0%, 100% { opacity: 0; transform: scale(0.5); }
      50% { opacity: 1; transform: scale(1); }
    }

    .welcome-title {
      font-size: 1.25rem;
      font-weight: 500;
      color: var(--text-secondary, #495057);
      margin: 0;
    }

    .month-title {
      font-size: 2rem;
      font-weight: 700;
      color: var(--text-primary, #212529);
      margin: 0.25rem 0 1rem;
    }

    .welcome-desc {
      font-size: 1rem;
      color: var(--text-secondary, #868e96);
      margin: 0 0 2rem;
    }

    .summary-preview {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      margin-bottom: 2rem;
    }

    .preview-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background: rgba(255, 255, 255, 0.8);
      backdrop-filter: blur(10px);
      border-radius: 1rem;
      border: 1px solid rgba(255, 255, 255, 0.5);
    }

    .preview-icon {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;

      mat-icon {
        font-size: 24px;
        width: 24px;
        height: 24px;
        color: white;
      }

      &.fixed { background: linear-gradient(135deg, #5c7cfa, #4263eb); }
      &.variable { background: linear-gradient(135deg, #fab005, #f59f00); }
      &.occasional { background: linear-gradient(135deg, #20c997, #12b886); }
    }

    .preview-info {
      flex: 1;
      text-align: right;
      display: flex;
      flex-direction: column;
    }

    .preview-label {
      font-size: 0.875rem;
      color: var(--text-secondary, #868e96);
    }

    .preview-value {
      font-size: 1.125rem;
      font-weight: 600;
      color: var(--text-primary, #212529);
    }

    .cta-button {
      height: 56px;
      padding: 0 2rem;
      font-size: 1.125rem;
      font-weight: 600;
      border-radius: 28px;
      background: linear-gradient(135deg, #ff922b, #f76707);
      color: white;
      box-shadow: 0 8px 24px rgba(255, 146, 43, 0.4);
      transition: all 0.3s ease;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 12px 32px rgba(255, 146, 43, 0.5);
      }

      mat-icon {
        margin-right: 0.5rem;
      }
    }

    /* Variables Step */
    .variables-step {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .entry-counter {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.25rem;
      font-size: 1rem;
      font-weight: 600;
      color: var(--text-secondary, #868e96);

      .separator {
        margin: 0 0.25rem;
      }
    }

    .category-card {
      background: rgba(255, 255, 255, 0.9);
      backdrop-filter: blur(20px);
      border-radius: 1.5rem;
      overflow: hidden;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08);
    }

    .category-header {
      padding: 1.5rem;
      background: linear-gradient(135deg, var(--category-color, #5c7cfa), color-mix(in srgb, var(--category-color, #5c7cfa), black 15%));
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .category-icon-wrapper {
      width: 56px;
      height: 56px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;

      mat-icon {
        font-size: 32px;
        width: 32px;
        height: 32px;
        color: white;
      }
    }

    .category-name {
      font-size: 1.5rem;
      font-weight: 700;
      color: white;
      margin: 0;
    }

    .category-body {
      padding: 1.5rem;
    }

    .target-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem;
      background: var(--surface-secondary, #f8f9fa);
      border-radius: 1rem;
      margin-bottom: 1.5rem;
    }

    .target-label {
      font-size: 0.875rem;
      color: var(--text-secondary, #868e96);
    }

    .target-value {
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--text-primary, #212529);
    }

    .suggestion-section {
      text-align: center;
      padding: 1.5rem;
      background: linear-gradient(135deg, #fff9db, #fff3bf);
      border-radius: 1rem;
      margin-bottom: 1.5rem;
    }

    .suggestion-header {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      color: #e67700;
      font-size: 0.875rem;
      font-weight: 500;
      margin-bottom: 0.5rem;

      mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
      }
    }

    .suggestion-value {
      font-size: 2rem;
      font-weight: 700;
      color: #e67700;
    }

    .suggestion-source {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      margin-top: 0.5rem;
      font-size: 0.75rem;
      color: #e67700;
      opacity: 0.8;

      mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
      }
    }

    .input-section {
      margin-bottom: 1.5rem;
    }

    .input-label {
      display: block;
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--text-secondary, #868e96);
      margin-bottom: 0.5rem;
    }

    .amount-input-wrapper {
      display: flex;
      align-items: center;
      background: white;
      border: 2px solid var(--border-default, #dee2e6);
      border-radius: 1rem;
      padding: 0 1rem;
      transition: all 0.2s ease;

      &:focus-within {
        border-color: #ff922b;
        box-shadow: 0 0 0 4px rgba(255, 146, 43, 0.1);
      }
    }

    .currency {
      font-size: 1.5rem;
      font-weight: 600;
      color: var(--text-tertiary, #adb5bd);
    }

    .amount-input {
      flex: 1;
      border: none;
      outline: none;
      font-size: 2rem;
      font-weight: 700;
      font-family: inherit;
      text-align: center;
      padding: 1rem;
      background: transparent;
      color: var(--text-primary, #212529);

      &::-webkit-inner-spin-button,
      &::-webkit-outer-spin-button {
        -webkit-appearance: none;
        margin: 0;
      }
    }

    .quick-actions {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .quick-action {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.875rem 1rem;
      border-radius: 0.75rem;
      font-size: 0.875rem;
      border-color: var(--border-default, #dee2e6);
      color: var(--text-secondary, #495057);

      &:hover {
        background: var(--surface-hover, #f1f3f5);
        border-color: #ff922b;
        color: #ff922b;
      }
    }

    .navigation-buttons {
      display: flex;
      justify-content: space-between;
      gap: 1rem;
      margin-top: 1rem;
    }

    .nav-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      border-radius: 1rem;
      font-weight: 500;

      &.prev {
        color: var(--text-secondary, #868e96);
      }

      &.next, &.finish {
        background: linear-gradient(135deg, #ff922b, #f76707);
        color: white;

        &:hover:not(:disabled) {
          box-shadow: 0 4px 16px rgba(255, 146, 43, 0.4);
        }
      }

      &.finish {
        background: linear-gradient(135deg, #40c057, #2f9e44);
      }
    }

    /* Occasional Step */
    .occasional-step {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .step-header {
      text-align: center;

      h2 {
        font-size: 1.5rem;
        font-weight: 700;
        color: var(--text-primary, #212529);
        margin: 1rem 0 0.25rem;
      }

      p {
        font-size: 0.875rem;
        color: var(--text-secondary, #868e96);
        margin: 0;
      }
    }

    .step-icon {
      width: 64px;
      height: 64px;
      border-radius: 20px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto;

      mat-icon {
        font-size: 32px;
        width: 32px;
        height: 32px;
        color: white;
      }

      &.occasional { background: linear-gradient(135deg, #20c997, #12b886); }
    }

    .occasional-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .occasional-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background: rgba(255, 255, 255, 0.8);
      border-radius: 1rem;
      border: 1px solid rgba(255, 255, 255, 0.5);
    }

    .item-icon {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;

      mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
      }
    }

    .item-info {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .item-desc {
      font-weight: 500;
      color: var(--text-primary, #212529);
    }

    .item-date {
      font-size: 0.75rem;
      color: var(--text-tertiary, #adb5bd);
    }

    .item-amount {
      font-weight: 600;
      color: var(--text-primary, #212529);
    }

    .occasional-total {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.5rem;
      background: rgba(255, 255, 255, 0.9);
      border-radius: 1rem;
      border: 2px solid #20c997;
    }

    .total-label {
      font-weight: 500;
      color: var(--text-secondary, #495057);
    }

    .total-value {
      font-size: 1.25rem;
      font-weight: 700;
      color: #20c997;
    }

    .no-occasional {
      text-align: center;
      padding: 2rem;
      color: var(--text-secondary, #868e96);

      mat-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
        color: #40c057;
        margin-bottom: 0.5rem;
      }

      p {
        margin: 0;
      }
    }

    .add-expense-btn {
      align-self: center;
      border-radius: 1rem;
      border-color: var(--border-default, #dee2e6);
    }

    /* Summary Step */
    .summary-step {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .summary-header {
      text-align: center;

      h2 {
        font-size: 1.5rem;
        font-weight: 700;
        color: var(--text-primary, #212529);
        margin: 0 0 0.25rem;
      }

      p {
        font-size: 0.875rem;
        color: var(--text-secondary, #868e96);
        margin: 0;
      }
    }

    .summary-breakdown {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .breakdown-section {
      background: rgba(255, 255, 255, 0.8);
      border-radius: 1rem;
      overflow: hidden;
    }

    .section-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
    }

    .section-icon {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;

      mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
        color: white;
      }

      &.fixed { background: linear-gradient(135deg, #5c7cfa, #4263eb); }
      &.variable { background: linear-gradient(135deg, #fab005, #f59f00); }
      &.occasional { background: linear-gradient(135deg, #20c997, #12b886); }
    }

    .section-title {
      flex: 1;
      font-weight: 600;
      color: var(--text-primary, #212529);
    }

    .section-total {
      font-size: 1.125rem;
      font-weight: 700;
      color: var(--text-primary, #212529);
    }

    .section-details {
      padding: 0 1rem 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .detail-row {
      display: flex;
      justify-content: space-between;
      padding: 0.5rem 0.75rem;
      background: var(--surface-secondary, #f8f9fa);
      border-radius: 0.5rem;
    }

    .detail-label {
      font-size: 0.875rem;
      color: var(--text-secondary, #495057);
    }

    .detail-value {
      font-weight: 500;
      color: var(--text-primary, #212529);

      &.over {
        color: #fa5252;
      }
    }

    .grand-total {
      padding: 1.5rem;
      background: linear-gradient(135deg, #212529, #343a40);
      border-radius: 1rem;
      color: white;

      &.over {
        background: linear-gradient(135deg, #fa5252, #e03131);
      }
    }

    .total-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .total-label {
      font-size: 1rem;
      opacity: 0.8;
    }

    .total-amount {
      font-size: 2rem;
      font-weight: 700;
    }

    .planned-row {
      display: flex;
      justify-content: space-between;
      margin-top: 0.75rem;
      font-size: 0.875rem;
      opacity: 0.8;

      .diff {
        font-weight: 600;

        &.positive {
          color: #8ce99a;
        }
      }
    }

    /* Celebration Step */
    .celebration-step {
      position: fixed;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #fff9db 0%, #fff3bf 50%, #ffec99 100%);
      z-index: 100;
    }

    .confetti-container {
      position: absolute;
      inset: 0;
      overflow: hidden;
      pointer-events: none;
    }

    .confetti-piece {
      position: absolute;
      top: -20px;
      width: 12px;
      height: 12px;
      background: var(--color);
      border-radius: 2px;
      animation: confetti-fall 4s cubic-bezier(0.25, 0.46, 0.45, 0.94) infinite;
      animation-delay: var(--delay);
      left: var(--x);
      transform: rotate(var(--rotation));
    }

    @keyframes confetti-fall {
      0% {
        opacity: 1;
        top: -20px;
        transform: rotate(var(--rotation)) translateX(0);
      }
      100% {
        opacity: 0;
        top: 100vh;
        transform: rotate(calc(var(--rotation) + 720deg)) translateX(100px);
      }
    }

    .celebration-content {
      text-align: center;
      z-index: 1;
      padding: 2rem;
    }

    .trophy-container {
      position: relative;
      display: inline-block;
      margin-bottom: 2rem;
    }

    .trophy {
      width: 120px;
      height: 120px;
      background: linear-gradient(135deg, #ffd43b, #fab005);
      border-radius: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 20px 60px rgba(250, 176, 5, 0.5);
      animation: trophy-bounce 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);

      mat-icon {
        font-size: 64px;
        width: 64px;
        height: 64px;
        color: white;
      }
    }

    .trophy-glow {
      position: absolute;
      inset: -20px;
      background: radial-gradient(circle, rgba(255, 212, 59, 0.4) 0%, transparent 70%);
      border-radius: 50%;
      animation: glow-pulse 2s ease-in-out infinite;
    }

    @keyframes trophy-bounce {
      0% { transform: scale(0); }
      60% { transform: scale(1.1); }
      100% { transform: scale(1); }
    }

    @keyframes glow-pulse {
      0%, 100% { opacity: 0.5; transform: scale(1); }
      50% { opacity: 1; transform: scale(1.2); }
    }

    .celebration-title {
      font-size: 2.5rem;
      font-weight: 700;
      color: #212529;
      margin: 0;
    }

    .celebration-subtitle {
      font-size: 1.25rem;
      color: #495057;
      margin: 0.5rem 0 2rem;
    }

    .final-stats {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 2rem;
      padding: 1.5rem;
      background: rgba(255, 255, 255, 0.8);
      border-radius: 1rem;
      margin-bottom: 2rem;
    }

    .stat {
      text-align: center;

      &.positive .stat-value {
        color: #40c057;
      }
    }

    .stat-value {
      display: block;
      font-size: 1.5rem;
      font-weight: 700;
      color: #212529;
    }

    .stat-label {
      font-size: 0.875rem;
      color: #868e96;
    }

    .stat-divider {
      width: 1px;
      height: 40px;
      background: #dee2e6;
    }

    .done-button {
      height: 56px;
      padding: 0 2rem;
      font-size: 1.125rem;
      font-weight: 600;
      border-radius: 28px;
      background: linear-gradient(135deg, #40c057, #2f9e44);
      color: white;
      box-shadow: 0 8px 24px rgba(64, 192, 87, 0.4);

      mat-icon {
        margin-inline-end: 0.5rem;
      }
    }

    /* Close Button */
    .close-wizard {
      position: fixed;
      top: 1rem;
      left: 1rem;
      z-index: 100;
      background: rgba(255, 255, 255, 0.8);
      backdrop-filter: blur(10px);
    }
  `]
})
export class CloseMonthWizardComponent implements OnInit {
  private budgetService = inject(BudgetService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  currentStep = signal<WizardStep>('welcome');
  currentVariableIndex = signal(0);
  isClosing = signal(false);

  currentYearMonth = getCurrentYearMonth();
  currentMonthLabel = formatMonthLabel(this.currentYearMonth);

  steps = [
    { id: 'welcome', label: 'פתיחה' },
    { id: 'variables', label: 'הוצאות משתנות' },
    { id: 'occasional', label: 'חד פעמי' },
    { id: 'summary', label: 'סיכום' },
  ];

  confettiPieces = Array.from({ length: 50 }, (_, i) => i);
  confettiColors = ['#ff922b', '#fab005', '#40c057', '#5c7cfa', '#be4bdb', '#fa5252'];

  // Get entries from service
  variableEntries = computed(() => {
    const suggestions = this.budgetService.closeMonthSuggestions();
    return suggestions.filter(e => e.expenseType === 'variable');
  });

  fixedEntries = computed(() => {
    const suggestions = this.budgetService.closeMonthSuggestions();
    return suggestions.filter(e => e.expenseType === 'fixed');
  });

  occasionalExpenses = computed(() => this.budgetService.occasionalExpenses());

  currentVariableEntry = computed(() => {
    const entries = this.variableEntries();
    const index = this.currentVariableIndex();
    return entries[index] || null;
  });

  fixedTotal = computed(() => {
    return this.fixedEntries().reduce((sum, e) => sum + e.plannedAmount, 0);
  });

  variableTotalActual = computed(() => {
    return this.variableEntries().reduce((sum, e) => sum + e.actualAmount, 0);
  });

  occasionalTotal = computed(() => {
    return this.occasionalExpenses().reduce((sum, e) => sum + e.amount, 0);
  });

  grandTotal = computed(() => {
    return this.fixedTotal() + this.variableTotalActual() + this.occasionalTotal();
  });

  totalPlanned = computed(() => {
    const summary = this.budgetService.monthSummary();
    return summary?.totalPlanned || 0;
  });

  progressPercent = computed(() => {
    const stepIndex = this.steps.findIndex(s => s.id === this.currentStep());
    return ((stepIndex + 1) / this.steps.length) * 100;
  });

  formatAmount = formatAmount;

  ngOnInit(): void {
    // Initialize actual amounts with suggestions
    const entries = this.variableEntries();
    entries.forEach(entry => {
      if (entry.actualAmount === 0) {
        entry.actualAmount = entry.suggestedAmount;
      }
    });
  }

  isStepActive(stepId: string): boolean {
    return this.currentStep() === stepId;
  }

  isStepCompleted(stepId: string): boolean {
    const currentIndex = this.steps.findIndex(s => s.id === this.currentStep());
    const stepIndex = this.steps.findIndex(s => s.id === stepId);
    return stepIndex < currentIndex;
  }

  isLastVariable(): boolean {
    return this.currentVariableIndex() === this.variableEntries().length - 1;
  }

  nextStep(): void {
    const currentIndex = this.steps.findIndex(s => s.id === this.currentStep());
    if (currentIndex < this.steps.length - 1) {
      this.currentStep.set(this.steps[currentIndex + 1].id as WizardStep);
    }
  }

  prevStep(): void {
    const currentIndex = this.steps.findIndex(s => s.id === this.currentStep());
    if (currentIndex > 0) {
      this.currentStep.set(this.steps[currentIndex - 1].id as WizardStep);
    }
  }

  nextVariableEntry(): void {
    if (this.isLastVariable()) {
      this.currentStep.set('occasional');
    } else {
      this.currentVariableIndex.update(i => i + 1);
    }
  }

  prevVariableEntry(): void {
    if (this.currentVariableIndex() === 0) {
      this.currentStep.set('welcome');
    } else {
      this.currentVariableIndex.update(i => i - 1);
    }
  }

  setAmount(entry: CloseMonthEntry, amount: number): void {
    entry.actualAmount = amount;
  }

  onInputFocus(event: FocusEvent): void {
    const input = event.target as HTMLInputElement;
    input.select();
  }

  getCategoryColor(category: string): string {
    const entry = this.budgetService.closeMonthSuggestions().find(e => e.category === category);
    return entry?.categoryColor || '#868e96';
  }

  getCategoryIcon(category: string): string {
    const entry = this.budgetService.closeMonthSuggestions().find(e => e.category === category);
    return entry?.categoryIcon || 'more_horiz';
  }

  getCategoryBg(category: string): string {
    const color = this.getCategoryColor(category);
    return color + '20';
  }

  formatDate(date: any): string {
    if (!date) return '';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('he-IL', { day: 'numeric', month: 'short' });
  }

  getRandomX(index: number): string {
    return (Math.random() * 100) + '%';
  }

  getRandomRotation(index: number): string {
    return (Math.random() * 360) + 'deg';
  }

  getConfettiColor(index: number): string {
    return this.confettiColors[index % this.confettiColors.length];
  }

  async closeMonth(): Promise<void> {
    this.isClosing.set(true);

    try {
      // Pass the variable entries directly - they are CloseMonthEntry[]
      const entries = this.variableEntries();
      await this.budgetService.closeMonth(entries);
      this.currentStep.set('celebration');
    } catch (error: any) {
      this.snackBar.open(error.message || 'שגיאה בסגירת החודש', 'סגור', { duration: 3000 });
    } finally {
      this.isClosing.set(false);
    }
  }
}
