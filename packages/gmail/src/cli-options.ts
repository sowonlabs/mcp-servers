import yargs from 'yargs/yargs';
import { hideBin } from 'yargs/helpers';

export interface CliOptions {
    protocol: 'STDIO' | 'HTTP';
    port: number;
    log: boolean;
    credentials?: string;
    install?: boolean;
}

export function parseCliOptions(): CliOptions {
    const args = yargs(hideBin(process.argv))
        .options({
            protocol: {
                type: 'string',
                choices: ['STDIO', 'HTTP'],
                default: 'STDIO',
                describe: 'Protocol to use (STDIO or HTTP)',
            },
            port: {
                type: 'number',
                default: 3000,
                describe: 'Port to use for HTTP protocol',
            },
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
            install: {
                alias: 'i',
                type: 'boolean',
                description: 'Run installation flow and print config',
                default: false,
            },
        })
        .parseSync();

    return args as CliOptions;
}