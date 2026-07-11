# Audio Visualization Hub

A static, GitHub Pages-ready launch hub for the Binary Tower, Galaxy, Particle Accelerator, and Spectrogramic Voxel Engine projects. The interface uses a left sidebar, a centered project menu, and a lightweight animated canvas background with no build step or runtime dependencies.

## Project structure

```text
index.html
assets/
  css/
    main.css
  images/
    favicon.svg
  js/
    config.js
    app.js
.nojekyll
```

## Configure project links

All project names, descriptions, categories, and destination URLs are centralized in:

```text
assets/js/config.js
```

Update a project's `href` value there if its GitHub Pages repository path changes.

## Publish with GitHub Pages

1. Create a new GitHub repository.
2. Upload the contents of this folder to the repository root.
3. Open **Settings → Pages**.
4. Under **Build and deployment**, select **Deploy from a branch**.
5. Select the `main` branch and `/ (root)`, then save.

## Local testing

Because the JavaScript uses ES modules, serve the folder over HTTP instead of opening `index.html` directly:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`.
