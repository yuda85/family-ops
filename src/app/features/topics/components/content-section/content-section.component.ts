import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatMenuModule } from '@angular/material/menu';
import { ContentSection, ChecklistItem, LinkItem } from '../../topics.models';

@Component({
  selector: 'app-content-section',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatCheckboxModule,
    MatMenuModule,
  ],
  template: `
    <div class="content-section" [class.collapsed]="section.isCollapsed">
      <!-- Section Header -->
      <div class="section-header">
        <button class="collapse-btn" (click)="toggleCollapse()">
          <mat-icon>{{ section.isCollapsed ? 'expand_more' : 'expand_less' }}</mat-icon>
        </button>

        @if (isEditingTitle) {
          <input
            #titleInput
            class="title-input"
            [(ngModel)]="editingTitle"
            (blur)="saveTitle()"
            (keydown.enter)="saveTitle()"
            (keydown.escape)="cancelTitleEdit()"
          />
        } @else {
          <h3 class="section-title" (click)="toggleCollapse()">
            {{ section.title || getSectionTypeLabel() }}
            @if (section.type === 'checklist' && section.items && section.items.length > 0) {
              <span class="checklist-count">{{ completedItemsCount }}/{{ section.items.length }}</span>
            }
          </h3>
        }

        <div class="section-actions">
          <button mat-icon-button [matMenuTriggerFor]="sectionMenu">
            <mat-icon>more_vert</mat-icon>
          </button>
          <mat-menu #sectionMenu="matMenu">
            <button mat-menu-item (click)="startTitleEdit()">
              <mat-icon>edit</mat-icon>
              <span>ערוך כותרת</span>
            </button>
            <button mat-menu-item class="delete-item" (click)="onDelete()">
              <mat-icon>delete</mat-icon>
              <span>מחק</span>
            </button>
          </mat-menu>
        </div>
      </div>

      <!-- Section Content -->
      @if (!section.isCollapsed) {
        <div class="section-content">
          @switch (section.type) {
            @case ('text') {
              <div class="text-section">
                @if (isEditingContent) {
                  <textarea
                    class="content-textarea"
                    [(ngModel)]="editingContent"
                    (blur)="saveContent()"
                    placeholder="הוסף תוכן..."
                    rows="4"
                  ></textarea>
                } @else {
                  <div
                    class="content-display"
                    [class.empty]="!section.content"
                    (click)="startContentEdit()"
                  >
                    {{ section.content || 'לחץ להוספת תוכן...' }}
                  </div>
                }
              </div>
            }

            @case ('checklist') {
              <div class="checklist-section">
                @for (item of section.items; track item.id) {
                  <div class="checklist-item">
                    <mat-checkbox
                      [checked]="item.isCompleted"
                      (change)="toggleChecklistItem(item)"
                    ></mat-checkbox>
                    @if (editingItemId === item.id) {
                      <input
                        class="item-input"
                        [(ngModel)]="editingItemText"
                        (blur)="saveChecklistItem(item)"
                        (keydown.enter)="saveChecklistItem(item)"
                        (keydown.escape)="cancelItemEdit()"
                      />
                    } @else {
                      <span
                        class="item-text"
                        [class.completed]="item.isCompleted"
                        (click)="startItemEdit(item)"
                      >
                        {{ item.text }}
                      </span>
                    }
                    <button mat-icon-button class="delete-btn" (click)="removeChecklistItem(item)">
                      <mat-icon>close</mat-icon>
                    </button>
                  </div>
                }
                <div class="add-item">
                  <mat-icon>add</mat-icon>
                  <input
                    class="add-input"
                    [(ngModel)]="newItemText"
                    (keydown.enter)="addChecklistItem()"
                    placeholder="הוסף פריט..."
                  />
                </div>
              </div>
            }

            @case ('links') {
              <div class="links-section">
                @for (link of section.links; track link.id) {
                  <a
                    class="link-item"
                    [href]="link.url"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <mat-icon>link</mat-icon>
                    <div class="link-info">
                      <span class="link-title">{{ link.title }}</span>
                      @if (link.description) {
                        <span class="link-description">{{ link.description }}</span>
                      }
                    </div>
                    <button mat-icon-button class="delete-btn" (click)="removeLink(link, $event)">
                      <mat-icon>close</mat-icon>
                    </button>
                  </a>
                }
                <div class="add-link">
                  <mat-icon>add_link</mat-icon>
                  <input
                    class="add-input"
                    [(ngModel)]="newLinkUrl"
                    (keydown.enter)="addLink()"
                    placeholder="הדבק קישור..."
                  />
                </div>
              </div>
            }
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .content-section {
      background: var(--surface-primary);
      border: 1px solid var(--border-subtle);
      border-radius: 0.75rem;
      overflow: hidden;
    }

    .section-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1rem;
      background: var(--surface-secondary);
    }

    .collapse-btn {
      background: none;
      border: none;
      cursor: pointer;
      padding: 0;
      color: var(--text-tertiary);
      display: flex;
      align-items: center;
    }

    .section-title {
      flex: 1;
      margin: 0;
      font-size: 0.9375rem;
      font-weight: 600;
      color: var(--text-primary);
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.5rem;

      .checklist-count {
        font-size: 0.75rem;
        font-weight: 500;
        color: var(--text-secondary);
        background: var(--surface-tertiary);
        padding: 0.125rem 0.5rem;
        border-radius: 9999px;
      }
    }

    .title-input {
      flex: 1;
      font-size: 0.9375rem;
      font-weight: 600;
      padding: 0.25rem 0.5rem;
      border: 1px solid var(--color-primary);
      border-radius: 0.25rem;
      outline: none;
      background: var(--surface-primary);
      color: var(--text-primary);
    }

    .section-actions {
      display: flex;
      gap: 0.25rem;

      button {
        color: var(--text-tertiary);
      }
    }

    .section-content {
      padding: 1rem;
    }

    /* Text Section */
    .text-section {
      .content-textarea {
        width: 100%;
        padding: 0.75rem;
        border: 1px solid var(--border-subtle);
        border-radius: 0.5rem;
        font-family: inherit;
        font-size: 0.9375rem;
        line-height: 1.5;
        resize: vertical;
        background: var(--surface-primary);
        color: var(--text-primary);

        &:focus {
          outline: none;
          border-color: var(--color-primary);
        }
      }

      .content-display {
        padding: 0.75rem;
        border: 1px dashed var(--border-subtle);
        border-radius: 0.5rem;
        cursor: pointer;
        white-space: pre-wrap;
        line-height: 1.5;
        color: var(--text-primary);

        &:hover {
          background: var(--surface-hover);
        }

        &.empty {
          color: var(--text-tertiary);
        }
      }
    }

    /* Checklist Section */
    .checklist-section {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .checklist-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.25rem 0;

      .item-text {
        flex: 1;
        cursor: pointer;
        padding: 0.25rem;
        color: var(--text-primary);

        &.completed {
          text-decoration: line-through;
          color: var(--text-tertiary);
        }

        &:hover {
          background: var(--surface-hover);
          border-radius: 0.25rem;
        }
      }

      .item-input {
        flex: 1;
        padding: 0.25rem 0.5rem;
        border: 1px solid var(--color-primary);
        border-radius: 0.25rem;
        outline: none;
        background: var(--surface-primary);
        color: var(--text-primary);
      }

      .delete-btn {
        opacity: 0;
        transition: opacity 0.15s ease;
        color: var(--text-tertiary);

        &:hover {
          color: var(--color-error);
        }
      }

      &:hover .delete-btn {
        opacity: 1;
      }
    }

    .add-item, .add-link {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem;
      color: var(--text-tertiary);

      mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
      }

      .add-input {
        flex: 1;
        border: none;
        background: transparent;
        font-size: 0.875rem;
        outline: none;
        color: var(--text-primary);

        &::placeholder {
          color: var(--text-tertiary);
        }
      }
    }

    /* Links Section */
    .links-section {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .link-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem;
      background: var(--surface-secondary);
      border-radius: 0.5rem;
      text-decoration: none;
      transition: background 0.15s ease;

      &:hover {
        background: var(--surface-hover);

        .delete-btn {
          opacity: 1;
        }
      }

      mat-icon {
        color: var(--color-primary);
      }

      .link-info {
        flex: 1;
        min-width: 0;
      }

      .link-title {
        display: block;
        color: var(--text-primary);
        font-weight: 500;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .link-description {
        display: block;
        color: var(--text-secondary);
        font-size: 0.75rem;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .delete-btn {
        opacity: 0;
        color: var(--text-tertiary);

        &:hover {
          color: var(--color-error);
        }
      }
    }

    .delete-item {
      color: var(--color-error);
    }
  `]
})
export class ContentSectionComponent {
  @Input({ required: true }) section!: ContentSection;
  @Output() sectionChange = new EventEmitter<ContentSection>();
  @Output() delete = new EventEmitter<void>();

  isEditingTitle = false;
  isEditingContent = false;
  editingTitle = '';
  editingContent = '';
  editingItemId: string | null = null;
  editingItemText = '';
  newItemText = '';
  newLinkUrl = '';

  get completedItemsCount(): number {
    return this.section.items?.filter(item => item.isCompleted).length || 0;
  }

  getSectionTypeLabel(): string {
    switch (this.section.type) {
      case 'text': return 'טקסט';
      case 'checklist': return 'רשימת משימות';
      case 'links': return 'קישורים';
      default: return 'קטע';
    }
  }

  toggleCollapse(): void {
    this.emitChange({ isCollapsed: !this.section.isCollapsed });
  }

  startTitleEdit(): void {
    this.editingTitle = this.section.title;
    this.isEditingTitle = true;
  }

  saveTitle(): void {
    if (this.editingTitle.trim() !== this.section.title) {
      this.emitChange({ title: this.editingTitle.trim() });
    }
    this.isEditingTitle = false;
  }

  cancelTitleEdit(): void {
    this.isEditingTitle = false;
  }

  startContentEdit(): void {
    this.editingContent = this.section.content || '';
    this.isEditingContent = true;
  }

  saveContent(): void {
    if (this.editingContent !== this.section.content) {
      this.emitChange({ content: this.editingContent });
    }
    this.isEditingContent = false;
  }

  toggleChecklistItem(item: ChecklistItem): void {
    const items = this.section.items?.map(i =>
      i.id === item.id ? { ...i, isCompleted: !i.isCompleted } : i
    );
    this.emitChange({ items });
  }

  startItemEdit(item: ChecklistItem): void {
    this.editingItemId = item.id;
    this.editingItemText = item.text;
  }

  saveChecklistItem(item: ChecklistItem): void {
    if (this.editingItemText.trim() !== item.text) {
      const items = this.section.items?.map(i =>
        i.id === item.id ? { ...i, text: this.editingItemText.trim() } : i
      );
      this.emitChange({ items });
    }
    this.editingItemId = null;
    this.editingItemText = '';
  }

  cancelItemEdit(): void {
    this.editingItemId = null;
    this.editingItemText = '';
  }

  addChecklistItem(): void {
    if (!this.newItemText.trim()) return;

    const newItem: ChecklistItem = {
      id: crypto.randomUUID(),
      text: this.newItemText.trim(),
      isCompleted: false,
      order: (this.section.items?.length || 0),
    };

    const items = [...(this.section.items || []), newItem];
    this.emitChange({ items });
    this.newItemText = '';
  }

  removeChecklistItem(item: ChecklistItem): void {
    const items = this.section.items?.filter(i => i.id !== item.id);
    this.emitChange({ items });
  }

  addLink(): void {
    if (!this.newLinkUrl.trim()) return;

    const url = this.newLinkUrl.trim();
    const newLink: LinkItem = {
      id: crypto.randomUUID(),
      url: url.startsWith('http') ? url : `https://${url}`,
      title: this.extractDomain(url),
      order: (this.section.links?.length || 0),
    };

    const links = [...(this.section.links || []), newLink];
    this.emitChange({ links });
    this.newLinkUrl = '';
  }

  removeLink(link: LinkItem, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    const links = this.section.links?.filter(l => l.id !== link.id);
    this.emitChange({ links });
  }

  onDelete(): void {
    this.delete.emit();
  }

  private emitChange(changes: Partial<ContentSection>): void {
    this.sectionChange.emit({ ...this.section, ...changes });
  }

  private extractDomain(url: string): string {
    try {
      const domain = new URL(url.startsWith('http') ? url : `https://${url}`).hostname;
      return domain.replace('www.', '');
    } catch {
      return url;
    }
  }
}
