import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { ThemeService } from '../../core/theme/theme.service';

interface Feature {
  icon: string;
  title: string;
  description: string;
}

interface Benefit {
  icon: string;
  title: string;
  description: string;
}

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
  ],
  template: `
    <div class="landing-page">
      <!-- Decorative background elements -->
      <div class="bg-decoration">
        <div class="blob blob-1"></div>
        <div class="blob blob-2"></div>
        <div class="blob blob-3"></div>
        <div class="grain-overlay"></div>
      </div>

      <!-- Theme toggle -->
      <button
        class="theme-toggle"
        (click)="themeService.cycleTheme()"
        [attr.aria-label]="'ערכת נושא: ' + themeService.getThemeLabel()"
      >
        <mat-icon>{{ themeService.getThemeIcon() }}</mat-icon>
      </button>

      <!-- Hero Section -->
      <section class="hero">
        <div class="hero-content">
          <div class="logo-wrapper">
            <img src="favicon.png" alt="FamilyOps" class="logo" />
            <div class="logo-glow"></div>
          </div>

          <h1 class="hero-title">
            <span class="title-line">ניהול משפחתי חכם</span>
            <span class="title-accent">פשוט יותר ביחד</span>
          </h1>

          <p class="hero-subtitle">
            כל מה שצריך כדי לנהל את המשפחה במקום אחד
          </p>

          <a routerLink="/auth/login" class="cta-button primary">
            <span>התחילו בחינם</span>
            <mat-icon>arrow_back</mat-icon>
          </a>

          <div class="hero-trust">
            <mat-icon>verified</mat-icon>
            <span>100% חינם • ללא כרטיס אשראי</span>
          </div>
        </div>

        <div class="hero-visual">
          <div class="floating-cards">
            <div class="float-card card-1">
              <mat-icon>calendar_month</mat-icon>
              <span>אירוע משפחתי</span>
            </div>
            <div class="float-card card-2">
              <mat-icon>shopping_cart</mat-icon>
              <span>קניות לשבת</span>
            </div>
            <div class="float-card card-3">
              <mat-icon>child_care</mat-icon>
              <span>חוג כדורגל</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Features Section -->
      <section class="features">
        <div class="section-header">
          <h2>כל מה שהמשפחה צריכה</h2>
          <p>ארבע יכולות מרכזיות לניהול יומיום משפחתי חלק</p>
        </div>

        <div class="features-grid">
          @for (feature of features; track feature.icon; let i = $index) {
            <div class="feature-card" [style.animation-delay]="(i * 100) + 'ms'">
              <div class="feature-icon-wrapper">
                <mat-icon>{{ feature.icon }}</mat-icon>
                <div class="icon-bg"></div>
              </div>
              <h3>{{ feature.title }}</h3>
              <p>{{ feature.description }}</p>
            </div>
          }
        </div>
      </section>

      <!-- Benefits Section -->
      <section class="benefits">
        <div class="benefits-container">
          @for (benefit of benefits; track benefit.icon; let i = $index) {
            <div class="benefit-card" [style.animation-delay]="(i * 150) + 'ms'">
              <div class="benefit-icon">
                <mat-icon>{{ benefit.icon }}</mat-icon>
              </div>
              <div class="benefit-content">
                <h3>{{ benefit.title }}</h3>
                <p>{{ benefit.description }}</p>
              </div>
            </div>
          }
        </div>
      </section>

      <!-- CTA Section -->
      <section class="final-cta">
        <div class="cta-card">
          <h2>מוכנים להתחיל?</h2>
          <p>הצטרפו לאלפי משפחות שכבר מנהלות את היומיום בצורה חכמה יותר</p>
          <a routerLink="/auth/login" class="cta-button secondary">
            <span>הצטרפו עכשיו - בחינם</span>
            <mat-icon>arrow_back</mat-icon>
          </a>
          <div class="cta-trust">
            <span>🔒 מאובטח</span>
            <span>•</span>
            <span>💳 ללא כרטיס אשראי</span>
            <span>•</span>
            <span>✨ 100% חינם</span>
          </div>
        </div>
      </section>

      <!-- Footer -->
      <footer class="landing-footer">
        <div class="footer-content">
          <div class="footer-brand">
            <img src="favicon.png" alt="FamilyOps" class="footer-logo" />
            <span>FamilyOps</span>
          </div>
          <div class="footer-info">
            <span>גרסה 1.0.0</span>
            <span>•</span>
            <span>© {{ currentYear }} FamilyOps</span>
          </div>
        </div>
      </footer>
    </div>
  `,
  styles: [`
    /* ========================================
       LANDING PAGE - Warm Family Aesthetic
       ======================================== */

    .landing-page {
      min-height: 100vh;
      background: var(--surface-app);
      overflow-x: hidden;
      position: relative;
    }

    /* ----------------------------------------
       Background Decorations
       ---------------------------------------- */

    .bg-decoration {
      position: fixed;
      inset: 0;
      pointer-events: none;
      overflow: hidden;
      z-index: 0;
    }

    .blob {
      position: absolute;
      border-radius: 50%;
      filter: blur(80px);
      opacity: 0.4;
      animation: float 20s ease-in-out infinite;
    }

    .blob-1 {
      width: 600px;
      height: 600px;
      background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-alpha) 100%);
      top: -200px;
      right: -200px;
      animation-delay: 0s;
    }

    .blob-2 {
      width: 500px;
      height: 500px;
      background: linear-gradient(135deg, var(--color-secondary) 0%, rgba(135, 168, 120, 0.3) 100%);
      bottom: 20%;
      left: -150px;
      animation-delay: -7s;
    }

    .blob-3 {
      width: 400px;
      height: 400px;
      background: linear-gradient(135deg, #e07a5f 0%, rgba(224, 122, 95, 0.2) 100%);
      bottom: -100px;
      right: 20%;
      animation-delay: -14s;
    }

    .grain-overlay {
      position: absolute;
      inset: 0;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
      opacity: 0.03;
      mix-blend-mode: overlay;
    }

    @keyframes float {
      0%, 100% { transform: translate(0, 0) scale(1); }
      33% { transform: translate(30px, -30px) scale(1.05); }
      66% { transform: translate(-20px, 20px) scale(0.95); }
    }

    /* ----------------------------------------
       Theme Toggle
       ---------------------------------------- */

    .theme-toggle {
      position: fixed;
      top: 1.5rem;
      left: 1.5rem;
      z-index: 100;
      background: var(--surface-primary);
      border: 1px solid var(--border-subtle);
      border-radius: 50%;
      width: 48px;
      height: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);

      mat-icon {
        color: var(--text-secondary);
        transition: transform 0.3s ease;
      }

      &:hover {
        transform: scale(1.1);
        box-shadow: 0 6px 24px rgba(0, 0, 0, 0.12);

        mat-icon {
          transform: rotate(180deg);
          color: var(--color-primary);
        }
      }
    }

    /* ----------------------------------------
       Hero Section
       ---------------------------------------- */

    .hero {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      position: relative;
      z-index: 1;

      @media (min-width: 1024px) {
        padding: 4rem;
      }
    }

    .hero-content {
      text-align: center;
      max-width: 600px;
      animation: fadeInUp 0.8s ease-out;
    }

    .logo-wrapper {
      position: relative;
      display: inline-block;
      margin-bottom: 2rem;
    }

    .logo {
      width: 100px;
      height: 100px;
      object-fit: contain;
      position: relative;
      z-index: 2;
      animation: logoFloat 4s ease-in-out infinite;

      @media (min-width: 768px) {
        width: 120px;
        height: 120px;
      }
    }

    .logo-glow {
      position: absolute;
      inset: -20px;
      background: radial-gradient(circle, var(--color-primary-alpha) 0%, transparent 70%);
      border-radius: 50%;
      animation: pulse 3s ease-in-out infinite;
    }

    @keyframes logoFloat {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-10px); }
    }

    @keyframes pulse {
      0%, 100% { opacity: 0.5; transform: scale(1); }
      50% { opacity: 0.8; transform: scale(1.1); }
    }

    .hero-title {
      margin: 0 0 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .title-line {
      font-family: var(--font-family-display);
      font-size: clamp(2rem, 6vw, 3.5rem);
      font-weight: 700;
      color: var(--text-primary);
      line-height: 1.2;
    }

    .title-accent {
      font-family: var(--font-family-display);
      font-size: clamp(1.5rem, 4vw, 2.5rem);
      font-weight: 600;
      background: linear-gradient(135deg, var(--color-primary) 0%, #e07a5f 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .hero-subtitle {
      font-family: var(--font-family-hebrew);
      font-size: clamp(1rem, 2.5vw, 1.25rem);
      color: var(--text-secondary);
      margin: 0 0 2.5rem;
      line-height: 1.6;
    }

    .cta-button {
      display: inline-flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem 2rem;
      border-radius: 100px;
      font-family: var(--font-family-hebrew);
      font-size: 1.125rem;
      font-weight: 600;
      text-decoration: none;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      cursor: pointer;
      border: none;

      mat-icon {
        transition: transform 0.3s ease;
      }

      &:hover mat-icon {
        transform: translateX(-4px);
      }

      &.primary {
        background: linear-gradient(135deg, var(--color-primary) 0%, #b35a3d 100%);
        color: white;
        box-shadow: 0 8px 32px rgba(196, 112, 79, 0.35);

        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 40px rgba(196, 112, 79, 0.45);
        }
      }

      &.secondary {
        background: var(--surface-primary);
        color: var(--color-primary);
        border: 2px solid var(--color-primary);

        &:hover {
          background: var(--color-primary);
          color: white;
        }
      }
    }

    .hero-trust {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      margin-top: 1.5rem;
      color: var(--text-tertiary);
      font-size: 0.875rem;
      font-family: var(--font-family-hebrew);

      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
        color: var(--color-secondary);
      }
    }

    .hero-visual {
      display: none;

      @media (min-width: 1024px) {
        display: block;
        position: absolute;
        left: 10%;
        top: 50%;
        transform: translateY(-50%);
      }
    }

    .floating-cards {
      position: relative;
      width: 300px;
      height: 300px;
    }

    .float-card {
      position: absolute;
      background: var(--surface-primary);
      border: 1px solid var(--border-subtle);
      border-radius: 16px;
      padding: 1rem 1.25rem;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
      font-family: var(--font-family-hebrew);
      font-size: 0.875rem;
      color: var(--text-primary);
      animation: cardFloat 6s ease-in-out infinite;

      mat-icon {
        color: var(--color-primary);
      }

      &.card-1 {
        top: 0;
        right: 0;
        animation-delay: 0s;
      }

      &.card-2 {
        top: 50%;
        right: 30%;
        animation-delay: -2s;
      }

      &.card-3 {
        bottom: 0;
        right: 10%;
        animation-delay: -4s;
      }
    }

    @keyframes cardFloat {
      0%, 100% { transform: translateY(0) rotate(0deg); }
      50% { transform: translateY(-15px) rotate(2deg); }
    }

    /* ----------------------------------------
       Features Section
       ---------------------------------------- */

    .features {
      padding: 4rem 2rem 6rem;
      position: relative;
      z-index: 1;

      @media (min-width: 768px) {
        padding: 6rem 4rem 8rem;
      }
    }

    .section-header {
      text-align: center;
      margin-bottom: 3rem;
      animation: fadeInUp 0.8s ease-out;

      h2 {
        font-family: var(--font-family-display);
        font-size: clamp(1.75rem, 4vw, 2.5rem);
        font-weight: 700;
        color: var(--text-primary);
        margin: 0 0 0.75rem;
      }

      p {
        font-family: var(--font-family-hebrew);
        font-size: 1rem;
        color: var(--text-secondary);
        margin: 0;
      }
    }

    .features-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 1.5rem;
      max-width: 1200px;
      margin: 0 auto;

      @media (min-width: 640px) {
        grid-template-columns: repeat(2, 1fr);
      }

      @media (min-width: 1024px) {
        grid-template-columns: repeat(4, 1fr);
      }
    }

    .feature-card {
      background: var(--surface-primary);
      border: 1px solid var(--border-subtle);
      border-radius: 24px;
      padding: 2rem;
      text-align: center;
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      animation: fadeInUp 0.6s ease-out backwards;

      &:hover {
        transform: translateY(-8px);
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.12);
        border-color: var(--color-primary-alpha);

        .feature-icon-wrapper mat-icon {
          transform: scale(1.15);
        }

        .icon-bg {
          transform: scale(1.2);
        }
      }

      h3 {
        font-family: var(--font-family-display);
        font-size: 1.25rem;
        font-weight: 600;
        color: var(--text-primary);
        margin: 0 0 0.75rem;
      }

      p {
        font-family: var(--font-family-hebrew);
        font-size: 0.875rem;
        color: var(--text-secondary);
        margin: 0;
        line-height: 1.7;
      }
    }

    .feature-icon-wrapper {
      position: relative;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 72px;
      height: 72px;
      margin-bottom: 1.25rem;

      mat-icon {
        font-size: 36px;
        width: 36px;
        height: 36px;
        color: var(--color-primary);
        position: relative;
        z-index: 2;
        transition: transform 0.3s ease;
      }

      .icon-bg {
        position: absolute;
        inset: 0;
        background: linear-gradient(135deg, var(--color-primary-alpha) 0%, rgba(196, 112, 79, 0.05) 100%);
        border-radius: 20px;
        transition: transform 0.3s ease;
      }
    }

    /* ----------------------------------------
       Benefits Section
       ---------------------------------------- */

    .benefits {
      padding: 4rem 2rem;
      background: linear-gradient(180deg, transparent 0%, var(--surface-secondary) 100%);
      position: relative;
      z-index: 1;

      @media (min-width: 768px) {
        padding: 6rem 4rem;
      }
    }

    .benefits-container {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      max-width: 900px;
      margin: 0 auto;

      @media (min-width: 768px) {
        flex-direction: row;
        gap: 2rem;
      }
    }

    .benefit-card {
      flex: 1;
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      padding: 1.5rem;
      background: var(--surface-primary);
      border: 1px solid var(--border-subtle);
      border-radius: 20px;
      transition: all 0.3s ease;
      animation: fadeInUp 0.6s ease-out backwards;

      @media (min-width: 768px) {
        flex-direction: column;
        text-align: center;
        align-items: center;
        padding: 2rem;
      }

      &:hover {
        transform: translateY(-4px);
        box-shadow: 0 12px 40px rgba(0, 0, 0, 0.08);
      }
    }

    .benefit-icon {
      flex-shrink: 0;
      width: 56px;
      height: 56px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, var(--color-secondary) 0%, #6b9460 100%);
      border-radius: 16px;

      mat-icon {
        font-size: 28px;
        width: 28px;
        height: 28px;
        color: white;
      }
    }

    .benefit-content {
      h3 {
        font-family: var(--font-family-display);
        font-size: 1.125rem;
        font-weight: 600;
        color: var(--text-primary);
        margin: 0 0 0.5rem;
      }

      p {
        font-family: var(--font-family-hebrew);
        font-size: 0.875rem;
        color: var(--text-secondary);
        margin: 0;
        line-height: 1.6;
      }
    }

    /* ----------------------------------------
       Final CTA Section
       ---------------------------------------- */

    .final-cta {
      padding: 4rem 2rem 6rem;
      position: relative;
      z-index: 1;

      @media (min-width: 768px) {
        padding: 6rem 4rem 8rem;
      }
    }

    .cta-card {
      max-width: 700px;
      margin: 0 auto;
      text-align: center;
      background: linear-gradient(135deg, var(--color-primary) 0%, #954a32 100%);
      border-radius: 32px;
      padding: 3rem 2rem;
      box-shadow: 0 20px 60px rgba(196, 112, 79, 0.3);
      animation: fadeInUp 0.8s ease-out;

      @media (min-width: 768px) {
        padding: 4rem;
      }

      h2 {
        font-family: var(--font-family-display);
        font-size: clamp(1.5rem, 4vw, 2rem);
        font-weight: 700;
        color: white;
        margin: 0 0 0.75rem;
      }

      p {
        font-family: var(--font-family-hebrew);
        font-size: 1rem;
        color: rgba(255, 255, 255, 0.9);
        margin: 0 0 2rem;
        line-height: 1.6;
      }

      .cta-button.secondary {
        background: white;
        color: var(--color-primary);
        border: none;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);

        &:hover {
          background: #f5f5f5;
          transform: translateY(-2px);
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.2);
        }
      }
    }

    .cta-trust {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
      margin-top: 1.5rem;
      color: rgba(255, 255, 255, 0.85);
      font-family: var(--font-family-hebrew);
      font-size: 0.875rem;
    }

    /* ----------------------------------------
       Footer
       ---------------------------------------- */

    .landing-footer {
      padding: 2rem;
      border-top: 1px solid var(--border-subtle);
      position: relative;
      z-index: 1;
    }

    .footer-content {
      max-width: 1200px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;

      @media (min-width: 640px) {
        flex-direction: row;
        justify-content: space-between;
      }
    }

    .footer-brand {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      color: var(--text-primary);
      font-family: var(--font-family-display);
      font-weight: 600;

      .footer-logo {
        width: 32px;
        height: 32px;
        object-fit: contain;
      }
    }

    .footer-info {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      color: var(--text-tertiary);
      font-family: var(--font-family-hebrew);
      font-size: 0.875rem;
    }

    /* ----------------------------------------
       Animations
       ---------------------------------------- */

    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `]
})
export class LandingComponent {
  themeService = inject(ThemeService);

  currentYear = new Date().getFullYear();

  features: Feature[] = [
    {
      icon: 'calendar_month',
      title: 'יומן משפחתי',
      description: 'אירועים משותפים, תזכורות וקידוד צבעים לכל בן משפחה'
    },
    {
      icon: 'shopping_cart',
      title: 'רשימת קניות',
      description: 'רשימות קניות משותפות עם קטגוריות וסימון פריטים'
    },
    {
      icon: 'topic',
      title: 'נושאים חשובים',
      description: 'מעקב אחר נושאים משפחתיים עם רשימות משימות'
    },
    {
      icon: 'child_care',
      title: 'ניהול ילדים',
      description: 'פרטי ילדים, חוגים, אנשי קשר ומידע חשוב'
    }
  ];

  benefits: Benefit[] = [
    {
      icon: 'savings',
      title: 'חינמי לגמרי',
      description: '100% חינם, ללא עלויות נסתרות'
    },
    {
      icon: 'bolt',
      title: 'פשוט ומהיר',
      description: 'ממשק פשוט שתוכנן במיוחד למשפחות'
    },
    {
      icon: 'security',
      title: 'מאובטח',
      description: 'מידע מוגן עם אימות Google'
    }
  ];
}
