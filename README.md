# attest-graphql

This is the graphql server which supports the attest frontend at https://github.com/grabbeh/attest. It originally formed part of that repository but conflict issues with Next 5 meant it was necessary to transfer out.

**Dependencies

- A MongoDB database string referenced in /config/db.js

**Development

- git clone
- npm install
- npm run compile-graph
- node ./graphql/compiled/server.js

**Production

- npm run compile-graph
- npm run start-graph
