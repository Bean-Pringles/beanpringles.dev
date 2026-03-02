const GITHUB_REPO = "Bean-Pringles/Quill";
const DOCS_PATH = "docs";
const GITHUB_API = "https://api.github.com/repos/" + GITHUB_REPO + "/contents/" + DOCS_PATH;

function parseMarkdown(md) {
  let html = md;

  // Fenced code blocks
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
    const escaped = code.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    return `<pre><code class="lang-${lang}">${escaped}</code></pre>`;
  });

  // Inline code
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");

  // Headings
  html = html.replace(/^#{6}\s+(.+)$/gm, "<h6>$1</h6>");
  html = html.replace(/^#{5}\s+(.+)$/gm, "<h5>$1</h5>");
  html = html.replace(/^#{4}\s+(.+)$/gm, "<h4>$1</h4>");
  html = html.replace(/^#{3}\s+(.+)$/gm, "<h3>$1</h3>");
  html = html.replace(/^#{2}\s+(.+)$/gm, "<h2>$1</h2>");
  html = html.replace(/^#{1}\s+(.+)$/gm, "<h1>$1</h1>");

  // Bold & italic
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>");
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");

  // Blockquotes
  html = html.replace(/^>\s+(.+)$/gm, "<blockquote>$1</blockquote>");

  // Unordered lists
  html = html.replace(/((?:^[-*+]\s+.+\n?)+)/gm, (match) => {
    const items = match.trim().split("\n").map(l => "<li>" + l.replace(/^[-*+]\s+/, "") + "</li>").join("");
    return "<ul>" + items + "</ul>";
  });

  // Ordered lists
  html = html.replace(/((?:^\d+\.\s+.+\n?)+)/gm, (match) => {
    const items = match.trim().split("\n").map(l => "<li>" + l.replace(/^\d+\.\s+/, "") + "</li>").join("");
    return "<ol>" + items + "</ol>";
  });

  // Horizontal rules
  html = html.replace(/^(---|\*\*\*|___)\s*$/gm, "<hr>");

  // Images before links
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">');

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

  // Paragraphs
  const lines = html.split("\n");
  const result = [];
  let para = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === "") {
      if (para.length) { result.push("<p>" + para.join(" ") + "</p>"); para = []; }
    } else if (/^<(h[1-6]|ul|ol|li|pre|blockquote|hr|img)/.test(trimmed)) {
      if (para.length) { result.push("<p>" + para.join(" ") + "</p>"); para = []; }
      result.push(trimmed);
    } else {
      para.push(trimmed);
    }
  }
  if (para.length) result.push("<p>" + para.join(" ") + "</p>");

  return result.join("\n");
}

function extractTitle(md) {
  const match = md.match(/^#{1}\s+(.+)$/m);
  return match ? match[1].trim() : null;
}

function buildHtml(title, bodyHtml, slug) {
  const year = new Date().getFullYear();
  return `<!DOCTYPE HTML>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no">
  <title>${title} \u2014 Quill Docs</title>
  <link rel="icon" type="image/png" href="/quill/images/favicon.png">
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
    header h1 { font-size: 2.5rem; color: #fff; word-wrap: break-word; }
    #content h1 { font-size: 2rem; margin: 1.5rem 0 0.75rem; }
    #content h2 { font-size: 1.6rem; margin: 1.5rem 0 0.75rem; color: #eee; }
    #content h3 { font-size: 1.3rem; margin: 1.2rem 0 0.6rem; color: #ddd; }
    #content h4, #content h5, #content h6 { margin: 1rem 0 0.5rem; color: #ccc; }
    #content p { font-size: 1.1rem; margin-bottom: 1rem; word-wrap: break-word; }
    #content a { color: #7eb8f7; text-decoration: none; border-bottom: 1px solid #3a6ea0; }
    #content a:hover { color: #add4ff; }
    #content ul, #content ol { margin: 0.75rem 0 1rem 1.5rem; }
    #content li { margin-bottom: 0.4rem; font-size: 1.05rem; }
    #content pre { background: #111; border: 1px solid #222; border-radius: 4px; padding: 1rem; overflow-x: auto; margin-bottom: 1rem; }
    #content code { font-family: inherit; font-size: 0.9rem; color: #7eb8f7; }
    #content pre code { color: #ccc; }
    #content blockquote { border-left: 3px solid #444; padding-left: 1rem; color: #888; margin: 1rem 0; font-style: italic; }
    #content hr { border: none; border-top: 1px solid #222; margin: 2rem 0; }
    #content img { max-width: 100%; border-radius: 4px; margin: 1rem 0; }
    #content strong { color: #fff; }
    #content em { color: #ddd; }
    footer { margin-top: 3rem; padding-top: 1rem; border-top: 1px solid #222; color: #555; text-align: center; font-size: 0.85rem; }
    footer a { color: #555; text-decoration: none; }
    footer a:hover { color: #aaa; }
    @media (max-width: 600px) {
      header h1 { font-size: 1.8rem; }
      #content p { font-size: 1rem; }
    }
  </style>
</head>
<body>
  <div class="container">
    <nav>
      <a href="/quill/">Quill</a>
      <span>/</span>
      <a href="/quill/search">docs</a>
      <span>/</span>
      <a href="/quill/docs/${slug}">${slug}</a>
    </nav>
    <header>
      <h1>${title}</h1>
    </header>
    <section id="content">
      ${bodyHtml}
    </section>
    <footer>
      &copy; ${year} Bean Pringles &mdash;
      <a href="https://github.com/${GITHUB_REPO}/blob/main/${DOCS_PATH}/${slug}.md">View source on GitHub</a>
    </footer>
  </div>
</body>
</html>`;
}

function errorPage(status, message) {
  return new Response(`<!DOCTYPE HTML>
<html lang="en"><head><meta charset="UTF-8"><title>${status}</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:"SF Mono",Consolas,monospace;background:#000;color:#fff;display:flex;align-items:center;justify-content:center;height:100vh}
  .wrap{text-align:center} h1{font-size:3rem;margin-bottom:1rem} p{color:#888;margin-bottom:2rem}
  a{color:#7eb8f7;text-decoration:none}
</style></head>
<body><div class="wrap">
  <h1>${status}</h1>
  <p>${message}</p>
  <a href="/quill/search">\u2190 Browse all docs</a>
</div></body></html>`, {
    status,
    headers: { "Content-Type": "text/html;charset=UTF-8" }
  });
}

export async function onRequest(context) {
  const url = new URL(context.request.url);
  const pathParts = url.pathname.replace(/\/$/, "").split("/");
  const slug = pathParts[pathParts.length - 1];

  if (!slug || slug === "docs") {
    return Response.redirect(new URL("/quill/search", context.request.url), 302);
  }

  const apiUrl = "https://api.github.com/repos/" + GITHUB_REPO + "/contents/" + DOCS_PATH + "/" + slug + ".md";

  let raw;
  try {
    const res = await fetch(apiUrl, {
      headers: {
        "User-Agent": "BeanPringles-QuillDocs/1.0",
        "Accept": "application/vnd.github.v3.raw",
      },
      cf: { cacheTtl: 60, cacheEverything: true }
    });

    if (res.status === 404) return errorPage(404, "No doc found for <code>" + slug + "</code>.");
    if (!res.ok) return errorPage(502, "Failed to fetch from GitHub. Try again shortly.");

    raw = await res.text();
  } catch (e) {
    return errorPage(502, "Network error fetching doc.");
  }

  const title = extractTitle(raw) ?? slug;
  const bodyMd = raw.replace(/^#{1}\s+.+$/m, "").trim();
  const bodyHtml = parseMarkdown(bodyMd);

  return new Response(buildHtml(title, bodyHtml, slug), {
    headers: {
      "Content-Type": "text/html;charset=UTF-8",
      "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
    }
  });
}