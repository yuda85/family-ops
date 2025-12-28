import { Component, Input, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { CommentsService } from '../../comments.service';
import { FamilyService } from '../../../../core/family/family.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { TopicComment } from '../../topics.models';
import { FamilyMember } from '../../../../core/family/family.models';

// Common emoji reactions
const REACTION_EMOJIS = ['👍', '❤️', '😊', '🎉', '👏', '🤔'];

@Component({
  selector: 'app-comment-thread',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatMenuModule,
    MatTooltipModule,
    MatSnackBarModule,
  ],
  template: `
    <div class="comment-thread">
      @if (commentsService.isLoading()) {
        <div class="loading">
          <span>טוען תגובות...</span>
        </div>
      } @else {
        <!-- Comment input for new top-level comment -->
        <div class="new-comment">
          <div class="comment-avatar">
            @if (currentUserPhoto) {
              <img [src]="currentUserPhoto" alt="You" />
            } @else {
              {{ currentUserInitial }}
            }
          </div>
          <div class="comment-input-wrapper">
            <textarea
              class="comment-input"
              [(ngModel)]="newCommentText"
              (keydown.enter)="$any($event).ctrlKey && addComment()"
              placeholder="הוסף תגובה..."
              rows="2"
            ></textarea>
            <button
              mat-flat-button
              color="primary"
              [disabled]="!newCommentText.trim()"
              (click)="addComment()"
            >
              <mat-icon>send</mat-icon>
              שלח
            </button>
          </div>
        </div>

        <!-- Comments list -->
        @if (commentsService.topLevelComments().length > 0) {
          <div class="comments-list">
            @for (comment of commentsService.topLevelComments(); track comment.id) {
              <div class="comment-item">
                <!-- Comment content -->
                <div class="comment-main">
                  <div class="comment-avatar">
                    @if (getMember(comment.createdBy)?.photoURL) {
                      <img [src]="getMember(comment.createdBy)?.photoURL" [alt]="getMember(comment.createdBy)?.displayName" />
                    } @else {
                      {{ getMember(comment.createdBy)?.displayName?.charAt(0) || '?' }}
                    }
                  </div>

                  <div class="comment-content">
                    <div class="comment-header">
                      <span class="author">{{ getMember(comment.createdBy)?.displayName || 'משתמש' }}</span>
                      <span class="time">{{ comment.createdAt ? formatTime(comment.createdAt.toDate()) : '' }}</span>
                      @if (comment.isEdited) {
                        <span class="edited">(נערך)</span>
                      }
                    </div>

                    @if (editingCommentId() === comment.id) {
                      <div class="edit-area">
                        <textarea
                          class="edit-input"
                          [(ngModel)]="editingContent"
                          rows="2"
                        ></textarea>
                        <div class="edit-actions">
                          <button mat-button (click)="cancelEdit()">ביטול</button>
                          <button mat-flat-button color="primary" (click)="saveEdit(comment)">שמור</button>
                        </div>
                      </div>
                    } @else {
                      <p class="comment-text">{{ comment.content }}</p>
                    }

                    <!-- Reactions -->
                    <div class="reactions-row">
                      @for (emoji of getReactionEmojis(comment); track emoji) {
                        <button
                          class="reaction-chip"
                          [class.my-reaction]="hasMyReaction(comment, emoji)"
                          (click)="toggleReaction(comment, emoji)"
                          [matTooltip]="getReactionTooltip(comment, emoji)"
                        >
                          {{ emoji }} {{ getReactionCount(comment, emoji) }}
                        </button>
                      }

                      <!-- Add reaction button -->
                      <button
                        mat-icon-button
                        class="add-reaction-btn"
                        [matMenuTriggerFor]="emojiMenu"
                      >
                        <mat-icon>add_reaction</mat-icon>
                      </button>
                      <mat-menu #emojiMenu="matMenu" class="emoji-menu">
                        <div class="emoji-grid">
                          @for (emoji of availableEmojis; track emoji) {
                            <button
                              mat-icon-button
                              (click)="toggleReaction(comment, emoji)"
                            >
                              {{ emoji }}
                            </button>
                          }
                        </div>
                      </mat-menu>

                      <!-- Reply button -->
                      <button
                        mat-button
                        class="reply-btn"
                        (click)="toggleReply(comment.id)"
                      >
                        <mat-icon>reply</mat-icon>
                        הגב
                      </button>

                      <!-- Actions menu -->
                      @if (canEditComment(comment)) {
                        <button mat-icon-button [matMenuTriggerFor]="commentMenu" class="menu-btn">
                          <mat-icon>more_vert</mat-icon>
                        </button>
                        <mat-menu #commentMenu="matMenu">
                          <button mat-menu-item (click)="startEdit(comment)">
                            <mat-icon>edit</mat-icon>
                            <span>ערוך</span>
                          </button>
                          <button mat-menu-item class="delete-item" (click)="deleteComment(comment)">
                            <mat-icon>delete</mat-icon>
                            <span>מחק</span>
                          </button>
                        </mat-menu>
                      }
                    </div>
                  </div>
                </div>

                <!-- Reply input -->
                @if (replyingToId() === comment.id) {
                  <div class="reply-input-wrapper">
                    <textarea
                      class="reply-input"
                      [(ngModel)]="replyText"
                      placeholder="כתוב תגובה..."
                      rows="2"
                    ></textarea>
                    <div class="reply-actions">
                      <button mat-button (click)="cancelReply()">ביטול</button>
                      <button
                        mat-flat-button
                        color="primary"
                        [disabled]="!replyText.trim()"
                        (click)="addReply(comment.id)"
                      >
                        שלח
                      </button>
                    </div>
                  </div>
                }

                <!-- Replies -->
                @if (comment.replyCount > 0) {
                  <div class="replies">
                    @for (reply of commentsService.getReplies(comment.id); track reply.id) {
                      <div class="reply-item">
                        <div class="comment-avatar small">
                          @if (getMember(reply.createdBy)?.photoURL) {
                            <img [src]="getMember(reply.createdBy)?.photoURL" [alt]="getMember(reply.createdBy)?.displayName" />
                          } @else {
                            {{ getMember(reply.createdBy)?.displayName?.charAt(0) || '?' }}
                          }
                        </div>

                        <div class="comment-content">
                          <div class="comment-header">
                            <span class="author">{{ getMember(reply.createdBy)?.displayName || 'משתמש' }}</span>
                            <span class="time">{{ reply.createdAt ? formatTime(reply.createdAt.toDate()) : '' }}</span>
                            @if (reply.isEdited) {
                              <span class="edited">(נערך)</span>
                            }
                          </div>

                          @if (editingCommentId() === reply.id) {
                            <div class="edit-area">
                              <textarea
                                class="edit-input"
                                [(ngModel)]="editingContent"
                                rows="2"
                              ></textarea>
                              <div class="edit-actions">
                                <button mat-button (click)="cancelEdit()">ביטול</button>
                                <button mat-flat-button color="primary" (click)="saveEdit(reply)">שמור</button>
                              </div>
                            </div>
                          } @else {
                            <p class="comment-text">{{ reply.content }}</p>
                          }

                          <!-- Reply reactions -->
                          <div class="reactions-row">
                            @for (emoji of getReactionEmojis(reply); track emoji) {
                              <button
                                class="reaction-chip"
                                [class.my-reaction]="hasMyReaction(reply, emoji)"
                                (click)="toggleReaction(reply, emoji)"
                              >
                                {{ emoji }} {{ getReactionCount(reply, emoji) }}
                              </button>
                            }

                            @if (canEditComment(reply)) {
                              <button mat-icon-button [matMenuTriggerFor]="replyMenu" class="menu-btn">
                                <mat-icon>more_vert</mat-icon>
                              </button>
                              <mat-menu #replyMenu="matMenu">
                                <button mat-menu-item (click)="startEdit(reply)">
                                  <mat-icon>edit</mat-icon>
                                  <span>ערוך</span>
                                </button>
                                <button mat-menu-item class="delete-item" (click)="deleteComment(reply)">
                                  <mat-icon>delete</mat-icon>
                                  <span>מחק</span>
                                </button>
                              </mat-menu>
                            }
                          </div>
                        </div>
                      </div>
                    }
                  </div>
                }
              </div>
            }
          </div>
        } @else {
          <div class="empty-state">
            <mat-icon>chat_bubble_outline</mat-icon>
            <p>אין תגובות עדיין</p>
            <span>היו הראשונים להגיב!</span>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .comment-thread {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .loading {
      display: flex;
      justify-content: center;
      padding: 1rem;
      color: var(--text-secondary);
    }

    /* New comment input */
    .new-comment {
      display: flex;
      gap: 0.75rem;
      padding: 1rem;
      background: var(--surface-secondary);
      border-radius: 0.75rem;
    }

    .comment-input-wrapper {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .comment-input, .reply-input, .edit-input {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid var(--border-subtle);
      border-radius: 0.5rem;
      font-family: inherit;
      font-size: 0.9375rem;
      resize: none;
      background: var(--surface-primary);
      color: var(--text-primary);

      &:focus {
        outline: none;
        border-color: var(--color-primary);
      }

      &::placeholder {
        color: var(--text-tertiary);
      }
    }

    .comment-input-wrapper button {
      align-self: flex-end;
    }

    /* Avatar */
    .comment-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1rem;
      font-weight: 600;
      background: var(--color-primary);
      color: white;
      flex-shrink: 0;

      img {
        width: 100%;
        height: 100%;
        border-radius: 50%;
        object-fit: cover;
      }

      &.small {
        width: 32px;
        height: 32px;
        font-size: 0.875rem;
      }
    }

    /* Comments list */
    .comments-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .comment-item {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .comment-main {
      display: flex;
      gap: 0.75rem;
    }

    .comment-content {
      flex: 1;
      min-width: 0;
    }

    .comment-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.25rem;
    }

    .author {
      font-weight: 600;
      color: var(--text-primary);
    }

    .time {
      font-size: 0.75rem;
      color: var(--text-tertiary);
    }

    .edited {
      font-size: 0.75rem;
      color: var(--text-tertiary);
      font-style: italic;
    }

    .comment-text {
      margin: 0;
      color: var(--text-primary);
      line-height: 1.5;
      white-space: pre-wrap;
    }

    /* Edit area */
    .edit-area {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .edit-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
    }

    /* Reactions */
    .reactions-row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-top: 0.5rem;
      flex-wrap: wrap;
    }

    .reaction-chip {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      padding: 0.25rem 0.5rem;
      background: var(--surface-secondary);
      border: 1px solid var(--border-subtle);
      border-radius: 9999px;
      font-size: 0.875rem;
      cursor: pointer;
      transition: all 0.15s ease;

      &:hover {
        background: var(--surface-hover);
      }

      &.my-reaction {
        background: color-mix(in srgb, var(--color-primary) 15%, transparent);
        border-color: var(--color-primary);
      }
    }

    .add-reaction-btn {
      color: var(--text-tertiary);
      transform: scale(0.9);
    }

    .reply-btn {
      color: var(--text-secondary);
      font-size: 0.875rem;

      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }
    }

    .menu-btn {
      color: var(--text-tertiary);
      opacity: 0;
      transition: opacity 0.15s ease;
    }

    .comment-main:hover .menu-btn,
    .reply-item:hover .menu-btn {
      opacity: 1;
    }

    /* Reply input */
    .reply-input-wrapper {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      margin-inline-start: 52px;
      padding: 0.75rem;
      background: var(--surface-secondary);
      border-radius: 0.5rem;
    }

    .reply-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
    }

    /* Replies */
    .replies {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      margin-inline-start: 52px;
      padding-inline-start: 1rem;
      border-inline-start: 2px solid var(--border-subtle);
    }

    .reply-item {
      display: flex;
      gap: 0.75rem;
    }

    /* Empty state */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 2rem;
      text-align: center;
      gap: 0.5rem;

      mat-icon {
        font-size: 40px;
        width: 40px;
        height: 40px;
        color: var(--text-tertiary);
      }

      p {
        margin: 0;
        font-weight: 500;
        color: var(--text-secondary);
      }

      span {
        font-size: 0.875rem;
        color: var(--text-tertiary);
      }
    }

    .delete-item {
      color: var(--color-error);
    }

    ::ng-deep .emoji-menu .mat-mdc-menu-content {
      padding: 0.5rem;
    }

    .emoji-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.25rem;

      button {
        font-size: 1.25rem;
      }
    }
  `]
})
export class CommentThreadComponent {
  @Input({ required: true }) topicId!: string;

  commentsService = inject(CommentsService);
  private familyService = inject(FamilyService);
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);

  availableEmojis = REACTION_EMOJIS;

  newCommentText = '';
  replyText = '';
  replyingToId = signal<string | null>(null);
  editingCommentId = signal<string | null>(null);
  editingContent = '';

  get currentUserPhoto(): string | undefined {
    const userId = this.authService.userId();
    if (!userId) return undefined;
    const member = this.familyService.members().find(m => m.id === userId);
    return member?.photoURL;
  }

  get currentUserInitial(): string {
    const userId = this.authService.userId();
    if (!userId) return '?';
    const member = this.familyService.members().find(m => m.id === userId);
    return member?.displayName?.charAt(0) || '?';
  }

  getMember(userId: string): FamilyMember | undefined {
    return this.familyService.members().find(m => m.id === userId);
  }

  formatTime(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'עכשיו';
    if (diffMins < 60) return `לפני ${diffMins} דקות`;
    if (diffHours < 24) return `לפני ${diffHours} שעות`;
    if (diffDays < 7) return `לפני ${diffDays} ימים`;

    return date.toLocaleDateString('he-IL', { day: 'numeric', month: 'short' });
  }

  canEditComment(comment: TopicComment): boolean {
    const userId = this.authService.userId();
    return comment.createdBy === userId || this.familyService.isAdmin();
  }

  // Reactions
  getReactionEmojis(comment: TopicComment): string[] {
    return Object.keys(comment.reactions || {});
  }

  getReactionCount(comment: TopicComment, emoji: string): number {
    return comment.reactions?.[emoji]?.length || 0;
  }

  hasMyReaction(comment: TopicComment, emoji: string): boolean {
    const userId = this.authService.userId();
    if (!userId) return false;
    return comment.reactions?.[emoji]?.includes(userId) || false;
  }

  getReactionTooltip(comment: TopicComment, emoji: string): string {
    const userIds = comment.reactions?.[emoji] || [];
    const names = userIds
      .map(id => this.getMember(id)?.displayName || 'משתמש')
      .join(', ');
    return names;
  }

  async toggleReaction(comment: TopicComment, emoji: string): Promise<void> {
    try {
      await this.commentsService.toggleReaction(this.topicId, comment.id, emoji);
    } catch (error: any) {
      this.snackBar.open(error.message || 'שגיאה', 'סגור', { duration: 3000 });
    }
  }

  // Comments
  async addComment(): Promise<void> {
    if (!this.newCommentText.trim()) return;

    try {
      await this.commentsService.createComment(this.topicId, {
        content: this.newCommentText.trim(),
      });
      this.newCommentText = '';
    } catch (error: any) {
      this.snackBar.open(error.message || 'שגיאה', 'סגור', { duration: 3000 });
    }
  }

  // Replies
  toggleReply(commentId: string): void {
    if (this.replyingToId() === commentId) {
      this.replyingToId.set(null);
      this.replyText = '';
    } else {
      this.replyingToId.set(commentId);
      this.replyText = '';
    }
  }

  cancelReply(): void {
    this.replyingToId.set(null);
    this.replyText = '';
  }

  async addReply(parentCommentId: string): Promise<void> {
    if (!this.replyText.trim()) return;

    try {
      await this.commentsService.createComment(this.topicId, {
        content: this.replyText.trim(),
        parentCommentId,
      });
      this.replyText = '';
      this.replyingToId.set(null);
    } catch (error: any) {
      this.snackBar.open(error.message || 'שגיאה', 'סגור', { duration: 3000 });
    }
  }

  // Edit
  startEdit(comment: TopicComment): void {
    this.editingCommentId.set(comment.id);
    this.editingContent = comment.content;
  }

  cancelEdit(): void {
    this.editingCommentId.set(null);
    this.editingContent = '';
  }

  async saveEdit(comment: TopicComment): Promise<void> {
    if (!this.editingContent.trim()) return;

    try {
      await this.commentsService.updateComment(this.topicId, comment.id, this.editingContent);
      this.editingCommentId.set(null);
      this.editingContent = '';
    } catch (error: any) {
      this.snackBar.open(error.message || 'שגיאה', 'סגור', { duration: 3000 });
    }
  }

  // Delete
  async deleteComment(comment: TopicComment): Promise<void> {
    try {
      await this.commentsService.deleteComment(this.topicId, comment.id);
      this.snackBar.open('התגובה נמחקה', '', { duration: 2000 });
    } catch (error: any) {
      this.snackBar.open(error.message || 'שגיאה', 'סגור', { duration: 3000 });
    }
  }
}
