# Vaultage

## Quick start

    # Install dependencies and build all:
    make
    # Start a server:
    make serve
    # then browse to
    http://localhost:3000/


## Understanding the folder structure

- `vaultage` is the backend that simply checks for authentication, and stores and delivers the ciphertext to the clients. It is rather *dumb*, if you removes the authentication part, it simply stores the ciphertext (and some configuration). It also serves the webcli at the root path "/".
- `vaultage-client` is a collection of Typescript classes that run on the *client* and are used by the `vaultage-ui`'s. This is where the real magic happen: this class pulls the ciphertext from the `vaultage-server`, decrypts and parses it, allows the `vaultage-ui`'s to interact with the decrypted database, and then re-encrypts and sends the result to the server.
- `vaultage-ui-webcli` is a full-featured user interface that allows you do everything

## How to interact with the folders

- `vaultage`
    - `npm start` start the server
- `vaultage-client` : 
    - `make test` to test the build
    - `make dist/vaultage.js` to compile everything into a single `.js` file that can be imported by clients
    - `make demo` to compile and run a demo showing how to interact with Vaultage's main class, the `Vault`
    - `make clean` to remove the compiled `.js` files
- `vaultage-ui-webcli`
    - `make build` to
        - copy the compiled `.js` file from `vaultage-client` (you need to run `make dist/vaultage.js` in `vaultage-client`)
        - build the UI into `public/`
    - `make serve` to build and serve the UI at `http://localhost:9000`. It watches for file changes in the UI.
    - `make clean` to remove the compiled files in `public/dist`