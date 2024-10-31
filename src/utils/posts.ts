export function sortPosts(posts: any[]) {
    return posts.sort((a, b) => 
        new Date(b.frontmatter.date).getTime() - new Date(a.frontmatter.date).getTime()
    );
}