import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';

export async function GET({ params, request }) {
  const { slug } = params;
  
  try {
    const blogDir = join(process.cwd(), 'src/pages/blog');
    const htmlFile = join(blogDir, `${slug}.html`);
    
    if (!existsSync(htmlFile)) {
      return new Response('Not Found', { status: 404 });
    }
    
    const htmlContent = readFileSync(htmlFile, 'utf-8');
    
    return new Response(htmlContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });
  } catch (error) {
    return new Response('Internal Server Error', { status: 500 });
  }
}

export async function getStaticPaths() {
  const htmlPaths = [];
  
  try {
    const blogDir = join(process.cwd(), 'src/pages/blog');
    const files = readdirSync(blogDir);
    const htmlFiles = files.filter(file => file.endsWith('.html'));
    
    for (const filename of htmlFiles) {
      const slug = filename.replace('.html', '');
      htmlPaths.push({
        params: { slug }
      });
    }
  } catch (error) {
    console.log('No HTML files found:', error);
  }
  
  return htmlPaths;
}
