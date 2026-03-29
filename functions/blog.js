const GITHUB_REPO = "Bean-Pringles/beanpringles.dev";
const BLOG_PATH = "blog";
const GITHUB_API = "https://api.github.com/repos/" + GITHUB_REPO + "/contents/";

// Fetch all folders from the blog directory (each folder is a blog post)
async function fetchBlogPosts(path) {
  const res = await fetch(GITHUB_API + path, {
    headers: {
      "User-Agent": "BeanPringles-Blog/1.0",
      "Accept": "application/vnd.github.v3+json",
    },
    cf: { cacheTtl: 120, cacheEverything: true }
  });

  if (!res.ok) return [];

  const items = await res.json();
  let posts = [];

  for (const item of items) {
    if (item.type === "dir") {
      // Each directory represents a blog post
      // Try to fetch text.md from within the folder
      const textUrl = GITHUB_API + item.path + "/text.md";
      try {
        const textRes = await fetch(textUrl, {
          headers: {
            "User-Agent": "BeanPringles-Blog/1.0",
            "Accept": "application/vnd.github.v3+json",
          },
          cf: { cacheTtl: 120, cacheEverything: true }
        });
        
        if (textRes.ok) {
          const textData = await textRes.json();
          posts.push({
            name: item.name,
            slug: item.name, // folder name is the slug
            download_url: textData.download_url,
          });
        }
      } catch (e) {
        // Skip posts without text.md
        console.error("Failed to fetch text.md for " + item.name);
      }
    }
  }

  return posts;
}

export async function onRequest(context) {
  let posts = [];
  let fetchError = null;

  try {
    posts = await fetchBlogPosts(BLOG_PATH);
  } catch (e) {
    fetchError = e.message;
  }

  const year = new Date().getFullYear();
  const postsJson = JSON.stringify(posts);
  const errorBox = fetchError
    ? '<div class="error-box">Could not fetch blog posts: ' + fetchError + '</div>'
    : "";

  const clientScript = [
    "(function() {",
    "  var POSTS = " + postsJson + ";",
    "  var contentCache = {};",
    "  var allPosts = [];",
    "  var loadedCount = 0;",
    "",
    '  var searchEl = document.getElementById("search");',
    '  var resultsList = document.getElementById("results");',
    '  var statusEl = document.getElementById("status");',
    "",
    "  function escHtml(s) {",
    "    return String(s)",
    '      .replace(/&/g, "&amp;")',
    '      .replace(/</g, "&lt;")',
    '      .replace(/>/g, "&gt;")',
    '      .replace(/"/g, "&quot;");',
    "  }",
    "",
    "  function escRegex(s) {",
    "    return s.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&');",
    "  }",
    "",
    "  function highlight(text, query) {",
    "    if (!query) return escHtml(text);",
    '    var re = new RegExp("(" + escRegex(query) + ")", "gi");',
    '    return escHtml(text).replace(re, "<mark>$1</mark>");',
    "  }",
    "",
    "  function getExcerpt(content, query) {",
    "    if (!query) {",
    '      var lines = content.split("\\n").filter(function(l) {',
    '        return l.trim() && l.charAt(0) !== "#";',
    "      });",
    '      return lines.length ? lines[0].substring(0, 150) : "";',
    "    }",
    "    var idx = content.toLowerCase().indexOf(query.toLowerCase());",
    '    if (idx === -1) return "";',
    "    var start = Math.max(0, idx - 40);",
    "    var end = Math.min(content.length, idx + query.length + 80);",
    '    var excerpt = (start > 0 ? "..." : "") + content.substring(start, end) + (end < content.length ? "..." : "");',
    '    return excerpt.replace(/\\n/g, " ");',
    "  }",
    "",
    "  function renderResults(query) {",
    "    var q = query.toLowerCase();",
    "    var matches;",
    "    if (!q) {",
    "      matches = allPosts.slice().sort(function(a, b) { return a.slug.localeCompare(b.slug); });",
    "    } else {",
    "      matches = allPosts",
    "        .map(function(post) {",
    "          var nameScore = (post.slug.toLowerCase().indexOf(q) !== -1 || post.title.toLowerCase().indexOf(q) !== -1) ? 2 : 0;",
    "          var contentScore = post.content.toLowerCase().indexOf(q) !== -1 ? 1 : 0;",
    "          return { post: post, score: nameScore + contentScore };",
    "        })",
    "        .filter(function(x) { return x.score > 0; })",
    "        .sort(function(a, b) { return b.score - a.score; })",
    "        .map(function(x) { return x.post; });",
    "    }",
    "    if (matches.length === 0 && loadedCount === POSTS.length) {",
    '      resultsList.innerHTML = \'<li class="empty">No results for "\' + escHtml(query) + \'"</li>\';',
    '      statusEl.textContent = "";',
    "      return;",
    "    }",
    "    if (loadedCount === POSTS.length) {",
    '      statusEl.textContent = matches.length + " post(s) found";',
    "    }",
    '    var html = "";',
    "    for (var i = 0; i < matches.length; i++) {",
    "      var post = matches[i];",
    "      var excerpt = getExcerpt(post.content, query);",
    '      var excerptHtml = excerpt ? \'<div class="post-excerpt">\' + highlight(excerpt, query) + "</div>" : "";',
    '      html += "<li>"',
    '        + \'<a class="post-card" href="/blog/\' + post.slug + \'/">"\'',
    '        + \'<div class="post-title">\' + highlight(post.title, query) + "</div>"',
    '        + \'<div class="post-slug">/blog/\' + post.slug + "</div>"',
    "        + excerptHtml",
    '        + "</a></li>";',
    "    }",
    "    resultsList.innerHTML = html;",
    "  }",
    "",
    "  function fetchAll() {",
    "    if (POSTS.length === 0) {",
    '      resultsList.innerHTML = \'<li class="empty">No blog posts found.</li>\';',
    "      return;",
    "    }",
    '    resultsList.innerHTML = \'<li id="loading">Loading \' + POSTS.length + \' post(s)...</li>\';',
    "    var queue = POSTS.slice();",
    "    var CONCURRENCY = 6;",
    "    var active = 0;",
    "    function next() {",
    "      if (queue.length === 0) return;",
    "      var post = queue.shift();",
    "      active++;",
    "      fetch(post.download_url)",
    "        .then(function(r) { return r.text(); })",
    "        .then(function(text) {",
    "          contentCache[post.slug] = text;",
    "          var h1 = text.match(/^# (.+)$/m);",
    "          allPosts.push({ slug: post.slug, title: h1 ? h1[1].trim() : post.slug, content: text });",
    "        })",
    "        .catch(function() {",
    "          allPosts.push({ slug: post.slug, title: post.slug, content: '' });",
    "        })",
    "        .finally(function() {",
    "          loadedCount++;",
    '          statusEl.textContent = loadedCount + "/" + POSTS.length + " posts loaded";',
    "          renderResults(searchEl.value.trim());",
    "          active--;",
    "          next();",
    "        });",
    "      if (active < CONCURRENCY) next();",
    "    }",
    "    var initial = Math.min(CONCURRENCY, POSTS.length);",
    "    for (var i = 0; i < initial; i++) next();",
    "  }",
    "",
    '  searchEl.addEventListener("input", function() { renderResults(searchEl.value.trim()); });',
    "  fetchAll();",
    "})();"
  ].join("\n");

  const html = `<!DOCTYPE HTML>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no">
  <title>Blog \u2014 Bean Pringles</title>
  <link rel="icon" type="image/png" href="/images/favicon.png">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: "SF Mono", Consolas, "Liberation Mono", Menlo, monospace;
      line-height: 1.6;
      color: #fff;
      background-color: #000;
      overflow-x: hidden;
    }
    .container { max-width: 800px; margin: 0 auto; padding: 2rem; }
    nav { margin-bottom: 2rem; font-size: 0.9rem; }
    nav a { color: #888; text-decoration: none; border-bottom: 1px solid #333; padding-bottom: 1px; transition: color 0.2s; }
    nav a:hover { color: #fff; }
    nav span { color: #444; margin: 0 0.4rem; }
    header { padding-bottom: 1.5rem; border-bottom: 1px solid #222; margin-bottom: 2rem; }
    header h1 { font-size: 2.5rem; color: #fff; }
    header p { color: #888; margin-top: 0.5rem; font-size: 0.95rem; }
    #search {
      width: 100%;
      background: #111;
      border: 1px solid #333;
      border-radius: 4px;
      padding: 0.8rem 1rem;
      color: #fff;
      font-family: inherit;
      font-size: 1rem;
      outline: none;
      transition: border-color 0.2s;
      margin-bottom: 1rem;
    }
    #search:focus { border-color: #555; }
    #search::placeholder { color: #555; }
    #status { color: #555; font-size: 0.85rem; margin-bottom: 1rem; min-height: 1.2em; }
    #results { list-style: none; }
    .post-card {
      display: block;
      padding: 1.2rem;
      border: 1px solid #1e1e1e;
      border-radius: 4px;
      margin-bottom: 0.75rem;
      text-decoration: none;
      color: inherit;
      background: #0a0a0a;
      transition: border-color 0.15s, background 0.15s;
    }
    .post-card:hover { border-color: #333; background: #111; }
    .post-title { font-size: 1.15rem; color: #7eb8f7; margin-bottom: 0.3rem; }
    .post-slug { font-size: 0.8rem; color: #555; margin-bottom: 0.5rem; }
    .post-excerpt { font-size: 0.9rem; color: #777; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .post-card mark { background: #2a3f5e; color: #add4ff; border-radius: 2px; padding: 0 2px; }
    .empty { color: #555; text-align: center; padding: 3rem 0; }
    .error-box {
      background: #1a0000;
      border: 1px solid #5a0000;
      border-radius: 4px;
      padding: 1rem;
      color: #f88;
      margin-bottom: 1.5rem;
      font-size: 0.9rem;
    }
    footer {
      margin-top: 3rem;
      padding-top: 1rem;
      border-top: 1px solid #222;
      color: #555;
      text-align: center;
      font-size: 0.85rem;
    }
    footer a { color: #555; text-decoration: none; }
    footer a:hover { color: #aaa; }
    @media (max-width: 600px) { header h1 { font-size: 1.8rem; } }
  </style>
</head>
<body>
  <div class="container">
    <nav>
      <a href="/">Home</a>
      <span>/</span>
      <a href="/blog">blog</a>
    </nav>
    <header>
      <h1>Blog</h1>
      <p>Search across all blog posts.</p>
    </header>
    ${errorBox}
    <input id="search" type="text" placeholder="Search posts by title or content..." autocomplete="off" spellcheck="false">
    <div id="status"></div>
    <ul id="results"><li class="empty">Loading...</li></ul>
    <footer>
      &copy; ${year} Bean Pringles &mdash;
      <a href="https://github.com/${GITHUB_REPO}/tree/main/${BLOG_PATH}">View on GitHub</a>
    </footer>
  </div>
  <script>${clientScript}</script>
</body>
</html>`;

  return new Response(html, {
    headers: {
      "Content-Type": "text/html;charset=UTF-8",
      "Cache-Control": "public, max-age=120, stale-while-revalidate=600",
    }
  });
}