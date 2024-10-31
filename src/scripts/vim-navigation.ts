export class VimNavigation {
    private currentIndex: number = -1;
    private posts: NodeListOf<Element>;
    private mode: 'normal' | 'insert' = 'normal';
    private modeIndicator: HTMLElement | null;

    constructor() {
        this.posts = document.querySelectorAll('.blog-post');
        this.modeIndicator = document.querySelector('.mode-indicator');
        this.initializeListeners();
    }

    private initializeListeners() {
        document.addEventListener('keydown', (e) => {
            if (this.mode === 'normal') {
                this.handleNormalMode(e);
            }
        });

        // Reset selection when switching views
        document.querySelectorAll('.command-link').forEach(link => {
            link.addEventListener('click', () => {
                this.currentIndex = -1;
                this.clearSelection();
            });
        });
    }

    private handleNormalMode(e: KeyboardEvent) {
        switch (e.key.toLowerCase()) {
            case 'j':
                e.preventDefault();
                this.moveDown();
                break;
            case 'k':
                e.preventDefault();
                this.moveUp();
                break;
            case 'enter':
                e.preventDefault();
                this.openSelected();
                break;
            case 'g':
                e.preventDefault();
                if (e.shiftKey) {
                    this.moveToBottom();
                } else {
                    this.moveToTop();
                }
                break;
        }
    }

    private moveDown() {
        if (this.currentIndex < this.posts.length - 1) {
            this.clearSelection();
            this.currentIndex++;
            this.highlightCurrent();
        }
    }

    private moveUp() {
        if (this.currentIndex > 0) {
            this.clearSelection();
            this.currentIndex--;
            this.highlightCurrent();
        }
    }

    private moveToTop() {
        this.clearSelection();
        this.currentIndex = 0;
        this.highlightCurrent();
    }

    private moveToBottom() {
        this.clearSelection();
        this.currentIndex = this.posts.length - 1;
        this.highlightCurrent();
    }

    private clearSelection() {
        this.posts.forEach(post => {
            post.classList.remove('vim-selected');
        });
    }

    private highlightCurrent() {
        if (this.currentIndex >= 0 && this.currentIndex < this.posts.length) {
            const currentPost = this.posts[this.currentIndex];
            currentPost.classList.add('vim-selected');
            currentPost.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }

    private openSelected() {
        if (this.currentIndex >= 0 && this.currentIndex < this.posts.length) {
            const currentPost = this.posts[this.currentIndex] as HTMLElement;
            currentPost.click();
        }
    }
}</content>