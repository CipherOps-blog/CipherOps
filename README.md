# CipherOps

CipherOps is a lightweight static GitHub Pages blog for cybersecurity and math articles.

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
