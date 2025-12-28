import { Injectable, inject, signal, computed } from '@angular/core';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  DocumentReference,
  CollectionReference,
  Query,
  QueryConstraint,
  Timestamp,
  serverTimestamp,
  writeBatch,
  DocumentData,
  WithFieldValue,
  UpdateData,
} from 'firebase/firestore';
import { Observable, from, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { getFirestoreDb } from './firebase.config';

/**
 * Generic Firestore service for CRUD operations
 * Provides type-safe access to Firestore collections
 */
@Injectable({
  providedIn: 'root',
})
export class FirestoreService {
  private db = getFirestoreDb();

  /**
   * Get a document reference
   */
  getDocRef<T = DocumentData>(path: string): DocumentReference<T> {
    return doc(this.db, path) as DocumentReference<T>;
  }

  /**
   * Get a collection reference
   */
  getCollectionRef<T = DocumentData>(path: string): CollectionReference<T> {
    return collection(this.db, path) as CollectionReference<T>;
  }

  /**
   * Get a single document by path
   */
  async getDocument<T>(path: string): Promise<T | null> {
    const docRef = this.getDocRef<T>(path);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as T;
    }
    return null;
  }

  /**
   * Get a single document as Observable
   */
  getDocument$<T>(path: string): Observable<T | null> {
    return new Observable<T | null>((observer) => {
      const docRef = this.getDocRef<T>(path);
      const unsubscribe = onSnapshot(
        docRef,
        (docSnap) => {
          if (docSnap.exists()) {
            observer.next({ id: docSnap.id, ...docSnap.data() } as T);
          } else {
            observer.next(null);
          }
        },
        (error) => observer.error(error)
      );

      return () => unsubscribe();
    });
  }

  /**
   * Get all documents in a collection
   */
  async getCollection<T>(path: string, ...queryConstraints: QueryConstraint[]): Promise<T[]> {
    const collectionRef = this.getCollectionRef<T>(path);
    const q = queryConstraints.length > 0 ? query(collectionRef, ...queryConstraints) : collectionRef;
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as T[];
  }

  /**
   * Get collection as Observable with real-time updates
   */
  getCollection$<T>(path: string, ...queryConstraints: QueryConstraint[]): Observable<T[]> {
    return new Observable<T[]>((observer) => {
      const collectionRef = this.getCollectionRef<T>(path);
      const q = queryConstraints.length > 0 ? query(collectionRef, ...queryConstraints) : collectionRef;

      const unsubscribe = onSnapshot(
        q,
        (querySnapshot) => {
          const docs = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as T[];
          observer.next(docs);
        },
        (error) => observer.error(error)
      );

      return () => unsubscribe();
    });
  }

  /**
   * Create a new document with auto-generated ID
   */
  async createDocument<T extends DocumentData>(
    collectionPath: string,
    data: WithFieldValue<T>
  ): Promise<string> {
    const collectionRef = this.getCollectionRef<T>(collectionPath);
    const docRef = doc(collectionRef);
    await setDoc(docRef, {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    } as WithFieldValue<T>);
    return docRef.id;
  }

  /**
   * Create or overwrite a document with specific ID
   */
  async setDocument<T extends DocumentData>(
    path: string,
    data: WithFieldValue<T>,
    merge = false
  ): Promise<void> {
    const docRef = this.getDocRef<T>(path);
    await setDoc(
      docRef,
      {
        ...data,
        updatedAt: serverTimestamp(),
      } as WithFieldValue<T>,
      { merge }
    );
  }

  /**
   * Update specific fields in a document
   */
  async updateDocument<T extends DocumentData>(
    path: string,
    data: UpdateData<T>
  ): Promise<void> {
    const docRef = this.getDocRef<T>(path);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    } as UpdateData<T>);
  }

  /**
   * Delete a document
   */
  async deleteDocument(path: string): Promise<void> {
    const docRef = this.getDocRef(path);
    await deleteDoc(docRef);
  }

  /**
   * Batch write multiple documents
   */
  async batchWrite(
    operations: Array<{
      type: 'set' | 'update' | 'delete';
      path: string;
      data?: DocumentData;
    }>
  ): Promise<void> {
    const batch = writeBatch(this.db);

    for (const op of operations) {
      const docRef = this.getDocRef(op.path);

      switch (op.type) {
        case 'set':
          batch.set(docRef, {
            ...op.data,
            updatedAt: serverTimestamp(),
          });
          break;
        case 'update':
          batch.update(docRef, {
            ...op.data,
            updatedAt: serverTimestamp(),
          });
          break;
        case 'delete':
          batch.delete(docRef);
          break;
      }
    }

    await batch.commit();
  }

  /**
   * Generate a new document ID
   */
  generateId(collectionPath: string): string {
    const collectionRef = this.getCollectionRef(collectionPath);
    return doc(collectionRef).id;
  }

  /**
   * Convert a Date to Firestore Timestamp
   */
  toTimestamp(date: Date): Timestamp {
    return Timestamp.fromDate(date);
  }

  /**
   * Convert a Firestore Timestamp to Date
   */
  fromTimestamp(timestamp: Timestamp): Date {
    return timestamp.toDate();
  }

  /**
   * Get server timestamp placeholder
   */
  getServerTimestamp() {
    return serverTimestamp();
  }
}

// Export query helpers for convenience
export { where, orderBy, limit, Timestamp, serverTimestamp };
