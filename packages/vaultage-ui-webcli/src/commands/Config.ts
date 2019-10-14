import { Config } from '../Config';
import { TimeoutService } from '../TimeoutService';
import { ICommand } from '../webshell/ICommand';
import { Shell } from '../webshell/Shell';

const AVAILABLE_OPTIONS: {[key: string]: keyof Config } = {
    username_default: 'defaultUserName',
    host_default: 'defaultHost',
    session_timeout: 'sessionTimeout',
    usage_count_visibility: 'usageCountVisibility',
    show_at_most_n_results: 'showAtMostNResults',
    auto_copy_first_result: 'autoCopyFirstResult',
    color_username_prompt: 'colorUsernamePrompt'
};

export class ConfigCommand implements ICommand {
    public readonly name = 'config';

    public readonly description = 'Configures the application.';
    constructor(
        private shell: Shell,
        private config: Config,
        private timeout: TimeoutService) {
    }

    public async handle(args: string[]) {

        switch (args[0]) {
            case 'set':
                this.set(this.parseArg('key', args[1]), this.parseArg('value', args[2]));
                break;
            case 'get':
                this.get(this.parseArg('key', args[1], false));
                break;
            case 'clear':
                this.clear(this.parseArg('key', args[1]));
                break;
            default:
                this.printUsage();
        }
    }

    public handleAutoCompleteParam(n: number): string[] {
        if (n === 0) {
            return ['set', 'get', 'clear'];
        } else if (n === 1) {
            return Object.keys(AVAILABLE_OPTIONS);
        }
        return [];
    }

    private printUsage() {
        this.shell.echo('Usage: config <set|get|clear> key [value]');
        this.shell.echo('keys: ' + Object.keys(AVAILABLE_OPTIONS).join(','));
        this.shell.echo('');
        this.shell.echo('Type `config get` to see current config.');
    }

    private clear(key: string) {
        const configName = this.convertKeyToConfigEntry(key);
        this.config.reset(configName);
        this.shell.echo('OK');
    }

    private set(key: string, value: string) {
        const configName = this.convertKeyToConfigEntry(key);

        if (configName === 'sessionTimeout') {
            this.timeout.validateTimeoutFormat(value);
        }
        let previousValue = this.config[configName];
        this.config.write(configName, value);
        let newValue = this.config[configName];
                
        if (configName === 'sessionTimeout') {
            this.timeout.resetTimeout();
        }
        this.shell.echo(`OK, previous value was ${previousValue}, new value is ${newValue}.`);
    }

    private get(key: string) {
        if (key == "") {
            for(let key of Object.keys(AVAILABLE_OPTIONS)) {
                const configName = this.convertKeyToConfigEntry(key);
                this.shell.echo(`${key} => ${String(this.config[configName])}`);
            }
        } else {
            const configName = this.convertKeyToConfigEntry(key);
            this.shell.echo(String(this.config[configName]));
        }
    }

    private convertKeyToConfigEntry(key: string): keyof Config {
        const setting = AVAILABLE_OPTIONS[key];
        if (!setting) {
            throw new Error(`Invalid key: ${key}`);
        }
        return setting;
    }

    private parseArg(name: string, value: string | undefined, required: boolean=true): string {
        if (value !== undefined) {
            if(required) {
                this.printUsage();
                throw new Error(`Missing argument '${name}'.`);
            }
            return value;
        }
        return '';
    }
}
