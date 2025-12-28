import { Injectable, inject, signal, computed, OnDestroy } from '@angular/core';
import { Timestamp } from 'firebase/firestore';
import { Subscription } from 'rxjs';
import { FirestoreService, orderBy } from '../../core/firebase/firestore.service';
import { AuthService } from '../../core/auth/auth.service';
import { FamilyService } from '../../core/family/family.service';
import { TopicComment, CreateCommentData } from './topics.models';

@Injectable({
  providedIn: 'root',
})
export class CommentsService implements OnDestroy {
  private firestoreService = inject(FirestoreService);
  private authService = inject(AuthService);
  private familyService = inject(FamilyService);

  // Subscriptions
  private commentsSubscription?: Subscription;

  // Private signals
  private _comments = signal<TopicComment[]>([]);
  private _currentTopicId = signal<string | null>(null);
  private _isLoading = signal(false);
  private _error = signal<string | null>(null);

  // Public readonly signals
  readonly comments = this._comments.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly error = this._error.asReadonly();

  // Computed signals
  readonly totalCount = computed(() => this._comments().length);

  /**
   * Top-level comments (not replies)
   */
  readonly topLevelComments = computed(() =>
    this._comments()
      .filter((c) => !c.parentCommentId)
      .sort((a, b) => (b.createdAt?.toMillis() ?? 0) - (a.createdAt?.toMillis() ?? 0))
  );

  /**
   * Get replies for a specific comment
   */
  getReplies(parentCommentId: string): TopicComment[] {
    return this._comments()
      .filter((c) => c.parentCommentId === parentCommentId)
      .sort((a, b) => (a.createdAt?.toMillis() ?? 0) - (b.createdAt?.toMillis() ?? 0));
  }

  ngOnDestroy(): void {
    this.unsubscribe();
  }

  /**
   * Subscribe to comments for a topic
   */
  subscribeToComments(topicId: string): void {
    const familyId = this.familyService.familyId();
    if (!familyId) {
      this._comments.set([]);
      return;
    }

    this._currentTopicId.set(topicId);
    this._isLoading.set(true);
    this._error.set(null);

    // Unsubscribe from previous
    this.commentsSubscription?.unsubscribe();

    // Subscribe to comments collection
    this.commentsSubscription = this.firestoreService
      .getCollection$<TopicComment>(
        `families/${familyId}/topics/${topicId}/comments`,
        orderBy('createdAt', 'desc')
      )
      .subscribe({
        next: (comments) => {
          this._comments.set(comments);
          this._isLoading.set(false);
        },
        error: (error) => {
          console.error('Error subscribing to comments:', error);
          this._error.set('שגיאה בטעינת תגובות');
          this._isLoading.set(false);
        },
      });
  }

  /**
   * Create a new comment
   */
  async createComment(topicId: string, data: CreateCommentData): Promise<string> {
    const familyId = this.familyService.familyId();
    const userId = this.authService.userId();

    if (!familyId || !userId) {
      throw new Error('אין משפחה פעילה');
    }

    if (!this.familyService.canEdit()) {
      throw new Error('אין לך הרשאה להגיב');
    }

    const commentData: Omit<TopicComment, 'id' | 'createdAt'> = {
      topicId,
      content: data.content.trim(),
      replyCount: 0,
      reactions: {},
      mentionedUserIds: data.mentionedUserIds || [],
      isEdited: false,
      createdBy: userId,
      ...(data.parentCommentId && { parentCommentId: data.parentCommentId }),
    };

    const commentId = await this.firestoreService.createDocument(
      `families/${familyId}/topics/${topicId}/comments`,
      commentData
    );

    // Update parent comment's reply count if this is a reply
    if (data.parentCommentId) {
      await this.incrementReplyCount(topicId, data.parentCommentId);
    }

    // Update topic's comment count
    await this.updateTopicCommentCount(topicId, 1);

    return commentId;
  }

  /**
   * Update a comment's content
   */
  async updateComment(topicId: string, commentId: string, content: string): Promise<void> {
    const familyId = this.familyService.familyId();
    const userId = this.authService.userId();

    if (!familyId || !userId) {
      throw new Error('אין משפחה פעילה');
    }

    // Verify user owns this comment
    const comment = this._comments().find((c) => c.id === commentId);
    if (!comment || comment.createdBy !== userId) {
      throw new Error('אין לך הרשאה לערוך תגובה זו');
    }

    await this.firestoreService.updateDocument(
      `families/${familyId}/topics/${topicId}/comments/${commentId}`,
      {
        content: content.trim(),
        isEdited: true,
        editedAt: this.firestoreService.getServerTimestamp(),
      }
    );
  }

  /**
   * Delete a comment
   */
  async deleteComment(topicId: string, commentId: string): Promise<void> {
    const familyId = this.familyService.familyId();
    const userId = this.authService.userId();

    if (!familyId || !userId) {
      throw new Error('אין משפחה פעילה');
    }

    // Verify user owns this comment or is admin
    const comment = this._comments().find((c) => c.id === commentId);
    if (!comment) return;

    if (comment.createdBy !== userId && !this.familyService.isAdmin()) {
      throw new Error('אין לך הרשאה למחוק תגובה זו');
    }

    // Delete the comment
    await this.firestoreService.deleteDocument(
      `families/${familyId}/topics/${topicId}/comments/${commentId}`
    );

    // Update parent's reply count if this was a reply
    if (comment.parentCommentId) {
      await this.incrementReplyCount(topicId, comment.parentCommentId, -1);
    }

    // Update topic's comment count (also subtract replies count)
    const totalToSubtract = 1 + comment.replyCount;
    await this.updateTopicCommentCount(topicId, -totalToSubtract);

    // Delete all replies to this comment
    const replies = this.getReplies(commentId);
    for (const reply of replies) {
      await this.firestoreService.deleteDocument(
        `families/${familyId}/topics/${topicId}/comments/${reply.id}`
      );
    }
  }

  /**
   * Toggle a reaction on a comment
   */
  async toggleReaction(topicId: string, commentId: string, emoji: string): Promise<void> {
    const familyId = this.familyService.familyId();
    const userId = this.authService.userId();

    if (!familyId || !userId) {
      throw new Error('אין משפחה פעילה');
    }

    const comment = this._comments().find((c) => c.id === commentId);
    if (!comment) return;

    const reactions = { ...comment.reactions };
    const usersWithEmoji = reactions[emoji] || [];

    if (usersWithEmoji.includes(userId)) {
      // Remove reaction
      reactions[emoji] = usersWithEmoji.filter((id) => id !== userId);
      if (reactions[emoji].length === 0) {
        delete reactions[emoji];
      }
    } else {
      // Add reaction
      reactions[emoji] = [...usersWithEmoji, userId];
    }

    await this.firestoreService.updateDocument(
      `families/${familyId}/topics/${topicId}/comments/${commentId}`,
      { reactions }
    );
  }

  /**
   * Clear comments subscription
   */
  clearComments(): void {
    this._comments.set([]);
    this._currentTopicId.set(null);
    this.commentsSubscription?.unsubscribe();
  }

  /**
   * Clear error
   */
  clearError(): void {
    this._error.set(null);
  }

  /**
   * Unsubscribe from all subscriptions
   */
  private unsubscribe(): void {
    this.commentsSubscription?.unsubscribe();
  }

  /**
   * Update parent comment's reply count
   */
  private async incrementReplyCount(
    topicId: string,
    parentCommentId: string,
    delta: number = 1
  ): Promise<void> {
    const familyId = this.familyService.familyId();
    if (!familyId) return;

    const parentComment = this._comments().find((c) => c.id === parentCommentId);
    if (!parentComment) return;

    await this.firestoreService.updateDocument(
      `families/${familyId}/topics/${topicId}/comments/${parentCommentId}`,
      {
        replyCount: Math.max(0, parentComment.replyCount + delta),
      }
    );
  }

  /**
   * Update topic's comment count
   */
  private async updateTopicCommentCount(topicId: string, delta: number): Promise<void> {
    const familyId = this.familyService.familyId();
    if (!familyId) return;

    try {
      const topic = await this.firestoreService.getDocument<any>(
        `families/${familyId}/topics/${topicId}`
      );

      if (topic) {
        await this.firestoreService.updateDocument(
          `families/${familyId}/topics/${topicId}`,
          {
            commentCount: Math.max(0, (topic.commentCount || 0) + delta),
          }
        );
      }
    } catch (error) {
      console.error('Error updating topic comment count:', error);
    }
  }
}
