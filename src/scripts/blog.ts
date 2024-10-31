// Line numbers handling
function updateLineNumbers() {
  const content = document.querySelector('.content');
  const lineNumbers = document.getElementById('line-numbers');
  
  if (!content || !lineNumbers) return;
  
  const contentHeight = content.getBoundingClientRect().height;
  const lineHeight = 24; // Height of each line in pixels
  const totalLines = Math.ceil(contentHeight / lineHeight);
  
  // Generate line numbers
  lineNumbers.innerHTML = Array.from(
    { length: totalLines }, 
    (_, i) => `<div class="line-number">${i + 1}</div>`
  ).join('');
}

// Post navigation
function setupPostNavigation() {
  const posts = document.querySelectorAll('.blog-post');
  const postList = document.getElementById('post-list');
  const postContent = document.getElementById('post-content');
  let selectedIndex = -1;

  function clearSelection() {
    posts.forEach(post => post.classList.remove('selected'));
  }

  function selectPost(index: number) {
    clearSelection();
    if (index >= 0 && index < posts.length) {
      selectedIndex = index;
      posts[index].classList.add('selected');
      posts[index].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }

  // Click handler for posts
  posts.forEach((post, index) => {
    post.addEventListener('click', () => {
      const content = post.getAttribute('data-content');
      
      if (content) {
        postList?.classList.add('hidden');
        postContent?.classList.remove('hidden');
        postContent.innerHTML = content;
        
        // Trigger line numbers update
        document.dispatchEvent(new Event('contentchange'));
      }
    });
  });

  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    // Check if search modal is open
    const searchModal = document.getElementById('search-modal');
    if (searchModal && !searchModal.classList.contains('hidden')) {
      return; // Don't handle vim bindings when search is open
    }

    const scrollAmount = 48; // Two lines at a time (24px per line)
    
    if (e.key.toLowerCase() === 'j') {
      e.preventDefault();
      if (postList?.classList.contains('hidden')) {
        window.scrollBy({ top: scrollAmount, behavior: 'smooth' });
      } else {
        selectPost(selectedIndex + 1);
      }
    } else if (e.key.toLowerCase() === 'k') {
      e.preventDefault();
      if (postList?.classList.contains('hidden')) {
        window.scrollBy({ top: -scrollAmount, behavior: 'smooth' });
      } else {
        selectPost(Math.max(0, selectedIndex - 1));
      }
    } else if (e.key === 'Enter' && !postList?.classList.contains('hidden')) {
      e.preventDefault();
      if (selectedIndex >= 0) {
        (posts[selectedIndex] as HTMLElement).click();
      }
    } else if (e.key.toLowerCase() === 'g') {
      e.preventDefault();
      if (e.shiftKey) {
        if (postList?.classList.contains('hidden')) {
          window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
        } else {
          selectPost(posts.length - 1); // G - go to bottom
        }
      } else {
        if (postList?.classList.contains('hidden')) {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          selectPost(0); // g - go to top
        }
      }
    }
  });
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  updateLineNumbers();
  setupPostNavigation();
  
  // Update line numbers when content changes
  const observer = new MutationObserver(() => {
    document.dispatchEvent(new Event('contentchange'));
  });
  
  const content = document.querySelector('.content');
  if (content) {
    observer.observe(content, { 
      childList: true, 
      subtree: true 
    });
  }

  // Listen for content change events
  document.addEventListener('contentchange', updateLineNumbers);
});