# LionWeb Repository Admin UI

A simple web interface for managing an instance of the [LionWeb Repository](https://github.com/LionWeb-io/lionweb-repository), built with SvelteKit and TypeScript.

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

## Features

- Manage LionWeb repositories: list them, add them, delete them
- View and edit repository contents
- Visualize the content of LionWeb files

## Setup

Currently this project depends on two unreleased modules of the LionWeb Repository. Therefore we have a script
that download the repository and link those modules. You can do that through:

```
npm run setup
```

## Development

To start the development server:

```bash
npm run dev
```

Then open [http://localhost:5173](http://localhost:5173) in your browser.

## Building for Production

To create a production build:

```bash
npm run build
```

To preview the production build:

```bash
npm run preview
```

## Project Structure

- `/src/routes` - Application routes and pages
- `/src/lib` - Shared components and utilities
- `/src/app.html` - HTML template
- `/src/app.d.ts` - TypeScript declarations
- `/static` - Static assets
