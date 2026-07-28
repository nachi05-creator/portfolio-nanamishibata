# nanami shibata portfolio

Design portfolio site — single-file HTML/CSS/JS (`index.html`) plus static assets under `image/`.

## Local preview

No build step. Just open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8080
```

then visit `http://localhost:8080`.

## Structure

- `index.html` — the whole site (markup, styles, script)
- `image/works/…`, `image/projects/…` — work/project media, organized by category
- `image/works/**/​*_web.mp4` — compressed, web-delivery copies of the original video files (originals are kept locally but are gitignored — see `.gitignore`)
- `image/_spiral_thumbs/` — small representative frames used on the hero spiral cards

## Deploying (GitHub Pages)

This repo is already set up to serve directly from the root of the default branch:

1. Push this repo to GitHub.
2. In the repo settings → **Pages**, set the source to the default branch, root folder.
3. The `.nojekyll` file at the repo root disables GitHub's default Jekyll processing, which would otherwise ignore the `image/_spiral_thumbs/` folder (Jekyll skips folders starting with `_`).
