import { json } from 'body-parser';
import * as cors from 'cors';
import { useExpressServer } from 'routing-controllers';

export { IVaultageConfig } from './VaultageConfig';
import * as express from 'express';
import * as path from 'path';

/**
 * Creates an express server serving the Vaultage API (used to save and retreive the encrypted passwords).
 *
 * This gives you an express server which you can bind to a tcp port or test offline using supertest.
 */
export function createVaultageAPIServer(): express.Application {
    const expressServer = express();

    // Allow requests from all origins.
    // We can do this because we don't have actual sessions and there is nothing more to be obtained
    // from the server if an attacker initiates a request from the victim's browser as opposed to if he initiates
    // it from anywhere else
    expressServer.use(cors());

    // I/O protocol is JSON based
    expressServer.use(json());

    // Bind API to server
    useExpressServer(expressServer, {
        controllers: [
            path.join(__dirname, 'controllers/**/*.js'),
            path.join(__dirname, 'controllers/**/*.ts'),
        ]
    });

    // We don't actually start the server yet. It is left to the caller to decide what to
    // do with this server.
    return expressServer;
}
