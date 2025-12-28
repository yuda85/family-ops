import { Injectable, signal } from '@angular/core';

/**
 * Simple confetti service for celebrations
 * Uses CSS animations instead of a heavy library
 */
@Injectable({
  providedIn: 'root',
})
export class ConfettiService {
  private _isActive = signal(false);
  private _intensity = signal<'small' | 'big'>('small');

  readonly isActive = this._isActive.asReadonly();
  readonly intensity = this._intensity.asReadonly();

  /**
   * Trigger small confetti burst (category complete)
   */
  celebrateCategory(): void {
    this._intensity.set('small');
    this._isActive.set(true);
    setTimeout(() => this._isActive.set(false), 1500);
  }

  /**
   * Trigger big confetti celebration (list complete)
   */
  celebrateListComplete(): void {
    this._intensity.set('big');
    this._isActive.set(true);
    setTimeout(() => this._isActive.set(false), 3000);
  }

  /**
   * Stop any active confetti
   */
  stop(): void {
    this._isActive.set(false);
  }
}
