# LionWeb Repository Admin UI

A simple web interface for managing an instance of the [LionWeb Repository](https://github.com/LionWeb-io/lionweb-repository), built with SvelteKit and TypeScript.

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

## Features

- Manage LionWeb repositories: list them, add them, delete them
- View and edit repository contents
- Visualize the content of LionWeb files

You can see this application in action:
[![Video](https://img.youtube.com/vi/Yo1f4TUpH6U/0.jpg)](https://www.youtube.com/watch?v=Yo1f4TUpH6U)

## Run the application through docker

This requires you to have Docker and Docker Compose installed.

If that is the case, you can just type:
```
docker-compose up
```

This will setup Postgres, the model-repository, and this application.
You can now visit http://localhost:5173 and enjoy!

## Setup

Currently this project depends on two unreleased modules of the LionWeb Repository. Therefore we have a script
that downloads the repository and link those modules. You can run it before the usual installation of dependencies:

```
npm run setup
npm install
```

## Development

To start the development server:

```bash
# We assume you completed the setup
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

## What's next?

Feel free to contribute! If you find any issues or have feature requests, 
[open an issue in this repository](https://github.com/LionWeb-io/lionweb-repo-admin-ui/issues).
