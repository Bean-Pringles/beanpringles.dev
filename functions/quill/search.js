const GITHUB_REPO = "Bean-Pringles/Quill";
const DOCS_PATH = "docs";
const GITHUB_API = "https://api.github.com/repos/" + GITHUB_REPO + "/contents/";

// Recursively fetch all .md files from a GitHub directory path
async function fetchFiles(path) {
  const res = await fetch(GITHUB_API + path, {
    headers: {
      "User-Agent": "BeanPringles-QuillDocs/1.0",
      "Accept": "application/vnd.github.v3+json",
    },
    cf: { cacheTtl: 120, cacheEverything: true }
  });

  if (!res.ok) return [];

  const items = await res.json();
  let files = [];

  for (const item of items) {
    if (item.type === "file" && item.name.endsWith(".md")) {
      files.push({
        name: item.name,
        // slug is path relative to docs/ e.g. "hello" or "guides/hello"
        slug: item.path.replace(DOCS_PATH + "/", "").replace(/\.md$/, ""),
        download_url: item.download_url,
      });
    } else if (item.type === "dir") {
      // Recurse into subdirectory
      const sub = await fetchFiles(item.path);
      files = files.concat(sub);
    }
  }

  return files;
}

export async function onRequest(context) {
  let files = [];
  let fetchError = null;

  try {
    files = await fetchFiles(DOCS_PATH);
  } catch (e) {
    fetchError = e.message;
  }

  const year = new Date().getFullYear();
  const filesJson = JSON.stringify(files);
  const errorBox = fetchError
    ? '<div class="error-box">Could not fetch docs list: ' + fetchError + '</div>'
    : "";

  const clientScript = [
    "(function() {",
    "  var FILES = " + filesJson + ";",
    "  var contentCache = {};",
    "  var allDocs = [];",
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
    '      return lines.length ? lines[0].substring(0, 120) : "";',
    "    }",
    "    var idx = content.toLowerCase().indexOf(query.toLowerCase());",
    '    if (idx === -1) return "";',
    "    var start = Math.max(0, idx - 40);",
    "    var end = Math.min(content.length, idx + query.length + 80);",
    '    var excerpt = (start > 0 ? "..." : "") + content.substring(start, end) + (end < content.length ? "..." : "");',
    '    return excerpt.replace(/\\n/g, " ");',
    "  }",
    "",
    // Folder label: "guides/hello" -> show "guides" badge
    "  function folderBadge(slug) {",
    '    var parts = slug.split("/");',
    '    if (parts.length < 2) return "";',
    "    var folder = parts.slice(0, parts.length - 1).join('/');",
    '    return \'<span class="doc-folder">\' + escHtml(folder) + "</span>";',
    "  }",
    "",
    "  function renderResults(query) {",
    "    var q = query.toLowerCase();",
    "    var matches;",
    "    if (!q) {",
    "      matches = allDocs.slice().sort(function(a, b) { return a.slug.localeCompare(b.slug); });",
    "    } else {",
    "      matches = allDocs",
    "        .map(function(doc) {",
    "          var nameScore = (doc.slug.toLowerCase().indexOf(q) !== -1 || doc.title.toLowerCase().indexOf(q) !== -1) ? 2 : 0;",
    "          var contentScore = doc.content.toLowerCase().indexOf(q) !== -1 ? 1 : 0;",
    "          return { doc: doc, score: nameScore + contentScore };",
    "        })",
    "        .filter(function(x) { return x.score > 0; })",
    "        .sort(function(a, b) { return b.score - a.score; })",
    "        .map(function(x) { return x.doc; });",
    "    }",
    "    if (matches.length === 0 && loadedCount === FILES.length) {",
    '      resultsList.innerHTML = \'<li class="empty">No results for "\' + escHtml(query) + \'"</li>\';',
    '      statusEl.textContent = "";',
    "      return;",
    "    }",
    "    if (loadedCount === FILES.length) {",
    '      statusEl.textContent = matches.length + " doc(s) found";',
    "    }",
    '    var html = "";',
    "    for (var i = 0; i < matches.length; i++) {",
    "      var doc = matches[i];",
    "      var excerpt = getExcerpt(doc.content, query);",
    '      var excerptHtml = excerpt ? \'<div class="doc-excerpt">\' + highlight(excerpt, query) + "</div>" : "";',
    '      html += "<li>"',
    '        + \'<a class="doc-card" href="/quill/docs/\' + doc.slug + \'">"\'',
    '        + \'<div class="doc-title-row">\' + \'<span class="doc-name">\' + highlight(doc.title, query) + "</span>" + folderBadge(doc.slug) + "</div>"',
    '        + \'<div class="doc-slug">/quill/docs/\' + doc.slug + "</div>"',
    "        + excerptHtml",
    '        + "</a></li>";',
    "    }",
    "    resultsList.innerHTML = html;",
    "  }",
    "",
    "  function fetchAll() {",
    "    if (FILES.length === 0) {",
    '      resultsList.innerHTML = \'<li class="empty">No docs found.</li>\';',
    "      return;",
    "    }",
    '    resultsList.innerHTML = \'<li id="loading">Loading \' + FILES.length + \' doc(s)...</li>\';',
    "    var queue = FILES.slice();",
    "    var CONCURRENCY = 6;",
    "    var active = 0;",
    "    function next() {",
    "      if (queue.length === 0) return;",
    "      var file = queue.shift();",
    "      active++;",
    "      fetch(file.download_url)",
    "        .then(function(r) { return r.text(); })",
    "        .then(function(text) {",
    "          contentCache[file.slug] = text;",
    "          var h1 = text.match(/^# (.+)$/m);",
    "          allDocs.push({ slug: file.slug, title: h1 ? h1[1].trim() : file.slug.split('/').pop(), content: text });",
    "        })",
    "        .catch(function() {",
    "          allDocs.push({ slug: file.slug, title: file.slug.split('/').pop(), content: '' });",
    "        })",
    "        .finally(function() {",
    "          loadedCount++;",
    '          statusEl.textContent = loadedCount + "/" + FILES.length + " docs loaded";',
    "          renderResults(searchEl.value.trim());",
    "          active--;",
    "          next();",
    "        });",
    "      if (active < CONCURRENCY) next();",
    "    }",
    "    var initial = Math.min(CONCURRENCY, FILES.length);",
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
  <title>Search \u2014 Quill Docs</title>
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
    .doc-card {
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
    .doc-card:hover { border-color: #333; background: #111; }
    .doc-title-row { display: flex; align-items: center; gap: 0.6rem; margin-bottom: 0.3rem; }
    .doc-name { font-size: 1.15rem; color: #7eb8f7; }
    .doc-folder {
      font-size: 0.75rem;
      color: #555;
      background: #151515;
      border: 1px solid #2a2a2a;
      border-radius: 3px;
      padding: 0.1rem 0.4rem;
    }
    .doc-slug { font-size: 0.8rem; color: #555; margin-bottom: 0.5rem; }
    .doc-excerpt { font-size: 0.9rem; color: #777; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .doc-card mark { background: #2a3f5e; color: #add4ff; border-radius: 2px; padding: 0 2px; }
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
      <a href="/quill/">Quill</a>
      <span>/</span>
      <a href="/quill/search">docs</a>
    </nav>
    <header>
      <h1>Documentation</h1>
      <p>Search across all Quill docs.</p>
    </header>
    ${errorBox}
    <input id="search" type="text" placeholder="Search docs by name or content..." autocomplete="off" spellcheck="false">
    <div id="status"></div>
    <ul id="results"><li class="empty">Loading...</li></ul>
    <footer>
      &copy; ${year} Bean Pringles &mdash;
      <a href="https://github.com/${GITHUB_REPO}/tree/main/${DOCS_PATH}">View on GitHub</a>
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