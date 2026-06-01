# CipherOps

CipherOps is a lightweight static GitHub Pages blog for security and math-minded articles, with a simple table of contents driven by a JSON manifest.

## Folder structure

```
root/
├── index.html
├── style.css
├── toc.js
├── render.js
├── animation.js
├── manifest.json
├── .nojekyll
├── pdfs/
│   └── (PDF files go here)
├── articles/
│   └── example-category/
│       └── example-article.md
└── assets/
    └── fonts/
```

## How to add a new article

1. Create a `.md` file under `articles/your-category/your-article.md`
2. Open `manifest.json` and add an entry to the relevant category array, or create a new category object
3. Push to GitHub, the TOC updates automatically

## How to add a PDF

- Drop the PDF file into the `/pdfs` folder
- In your article, add:

```html
<div class="pdf-embed" data-src="pdfs/yourfile.pdf"></div>
```

## How to define a graph in an article

Use a JSON block inside a `<div class="graph-definition">` element. The format is:

```json
{
  "nodes": [
    {"id": "A", "label": "Node A", "link": "https://example.com"},
    {"id": "B", "label": "Node B", "link": "articles/example-category/example-article.md"}
  ],
  "edges": [
    {"from": "A", "to": "B", "directed": true}
  ]
}
```

- `nodes` is an array of node objects with `id`, `label`, and optional `link`
- `edges` is an array of edge objects with `from`, `to`, and `directed`
- If a node `link` starts with `http`, it opens in a new tab
- Otherwise, internal links load an article within the blog

## How to write math

- Inline math: `$your formula$`
- Display math: `$$your formula$$`
- MathJax 3 handles rendering automatically
