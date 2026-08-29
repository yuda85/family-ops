import { Injectable, inject, signal } from '@angular/core';
import { getMessaging, getToken, isSupported, onMessage } from 'firebase/messaging';

import { environment } from '../../../environments/environment';
import { FirestoreService } from '../firebase/firestore.service';
import { AuthService } from '../auth/auth.service';
import { FamilyService } from '../family/family.service';

export type PushState =
  | 'unsupported'
  | 'unconfigured'
  | 'idle'
  | 'requesting'
  | 'enabled'
  | 'blocked'
  | 'error';

/**
 * Registers this device to receive push. Delivery itself happens server-side:
 * the runner reads the tokens stored here and calls FCM.
 *
 * Tokens are kept as a list per user, so both a phone and a laptop can be
 * registered at once.
 */
@Injectable({ providedIn: 'root' })
export class PushService {
  private firestore = inject(FirestoreService);
  private auth = inject(AuthService);
  private family = inject(FamilyService);

  private _state = signal<PushState>('idle');
  private _error = signal<string | null>(null);

  readonly state = this._state.asReadonly();
  readonly error = this._error.asReadonly();

  /**
   * Asks for notification permission and stores the resulting token. Must be
   * called from a user gesture - browsers reject a permission prompt that the
   * user did not ask for.
   */
  async enable(): Promise<void> {
    this._error.set(null);

    if (!environment.vapidKey) {
      this._state.set('unconfigured');
      this._error.set('חסר מפתח Web Push בהגדרות הפרויקט.');
      return;
    }

    if (!(await isSupported())) {
      this._state.set('unsupported');
      return;
    }

    this._state.set('requesting');

    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        this._state.set('blocked');
        return;
      }

      // Resolved against <base href>, which is '/family-ops/' once deployed
      // to GitHub Pages - an absolute '/...' path would 404 there.
      const swUrl = new URL('firebase-messaging-sw.js', document.baseURI).toString();
      const registration = await navigator.serviceWorker.register(swUrl);
      const token = await getToken(getMessaging(), {
        vapidKey: environment.vapidKey,
        serviceWorkerRegistration: registration,
      });

      if (!token) {
        this._state.set('error');
        this._error.set('לא התקבל מזהה התקן.');
        return;
      }

      await this.storeToken(token);
      this.listenInForeground();
      this._state.set('enabled');
    } catch (error) {
      this._state.set('error');
      this._error.set(error instanceof Error ? error.message : 'הפעלת ההתראות נכשלה.');
    }
  }

  private async storeToken(token: string): Promise<void> {
    const userId = this.auth.user()?.id;
    const familyId = this.family.familyId();
    if (!userId || !familyId) throw new Error('אין משתמש או משפחה פעילים');

    const path = `families/${familyId}/pushTokens/${userId}`;
    const existing = await this.firestore.getDocument<{ tokens?: string[] }>(path);
    const tokens = new Set(existing?.tokens ?? []);
    tokens.add(token);

    await this.firestore.setDocument(path, { tokens: [...tokens] }, true);
  }

  /**
   * With the app open in the foreground the service worker stays quiet, so the
   * notification is raised here instead.
   */
  private listenInForeground(): void {
    onMessage(getMessaging(), (payload) => {
      const { title, body } = payload.notification ?? {};
      if (!title) return;
      const icon = new URL('icon-192.png', document.baseURI).toString();
      new Notification(title, { body, icon, dir: 'rtl', lang: 'he' });
    });
  }
}
