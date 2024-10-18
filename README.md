# Tauri + React + Typescript

This template should help get you started developing with Tauri, React and Typescript in Vite.

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)

// TODO: create a filter, sort, pagination situation for getting tasks on the server side.
// TODO: start work on a dynamic filtering query.
// TODO: add insert capability to rust backend for task
// TODO: establish comment and tag relationships with foreign keys
// TODO: establish unique constraint for tag names
// TODO: create index for tags?
// TODO: figure out if reading the database_url from the .env file is ok for a prod build. Where does the database actually get stored?
// TODO: embed migrations into the application startup.
// TODO: run migrations / check migrations when the application starts up.


// Helpful commands: 
// - sea-orm-cli generate entity  -o ./entity/gen -l --with-serde both --model-extra-attributes 'serde(rename_all = "camelCase")'