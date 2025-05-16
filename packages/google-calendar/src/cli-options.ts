import yargs from 'yargs/yargs';
import { hideBin } from 'yargs/helpers';

export interface CliOptions {
    log: boolean;
    credentials?: string;
}

export function parseCliOptions(): CliOptions {
    const args = yargs(hideBin(process.argv))
        .options({
            log: {
                alias: 'l',
                type: 'boolean',
                describe: 'Enable logging',
                default: false
            },
            credentials: {
                type: 'string',
                description: 'Path to credentials.json file',
                demandOption: false,
                default: 'credentials.json',
            },
        })
        .parseSync();

    return args as CliOptions;
}