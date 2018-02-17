import { IVaultDBEntryAttrs } from 'vaultage-client';
import { ConcreteRandomnessGenerator, IRandomness, Passwords } from 'vaultage-client';

import * as config from '../Config';
import { Global } from '../Global';
import * as lang from '../lang';
import { ICommand } from '../webshell/ICommand';
import { Shell } from '../webshell/Shell';

export class GenCommand implements ICommand {
    public readonly name = 'gen';

    public readonly description = 'Generates a new strong password, and adds an entry to the local db. Then, pushes an encrypted version of the db to the server.';

    constructor(
        private shell: Shell) {
    }

    public async handle() {

        if (!Global.vault) {
            this.shell.echoHTML(lang.ERR_NOT_AUTHENTICATED);
            return;
        }

        const rnd: IRandomness = new ConcreteRandomnessGenerator();
        const pwdGen = new Passwords(rnd);
        const password = pwdGen.generatePassword(
            config.PWD_GEN_LENGTH,
            config.PWD_GEN_USE_SYMBOLS,
            config.PWG_GEN_AVOID_VISUALLY_SIMILAR_CHARS,
            config.PWD_GEN_AVOID_PUNCTUATION_USED_IN_PROGRAMMING);

        const title = await this.shell.prompt('Title:');
        const username = await this.shell.prompt('Username:');
        const url = await this.shell.prompt('Url:');

        const newEntry: IVaultDBEntryAttrs = {
            title: title,
            login: username,
            password: password,
            url: url
        };

        const newEntryID = Global.vault.addEntry(newEntry);
        this.shell.echoHTML(`Added entry #${newEntryID}, generated password is <span class='blurred'>${password}</span>`);

        await Global.vault.save();

        this.shell.echo('Push OK, revision ' + Global.vault.getDBRevision() + '.');
        this.shell.separator();
    }
}
