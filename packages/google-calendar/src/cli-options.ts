import yargs from 'yargs/yargs';
import { hideBin } from 'yargs/helpers';

export interface CliOptions {
    port: number;
    log: boolean;
    credentials?: string;
    install?: boolean;
    protocol?: string; // protocol 옵션 추가
}

export function parseCliOptions(): CliOptions {
    const args = yargs(hideBin(process.argv))
        .options({
            port: {
                alias: 'p',
                type: 'number',
                description: 'Port number',
                default: 3000
            },
            log: {
                alias: 'l',
                type: 'boolean',
                describe: 'Enable logging',
                default: false
            },
            credentials: {
                alias: 'c',
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
            protocol: { // protocol 옵션 정의 추가
                alias: 'p',
                type: 'string',
                description: 'Server protocol (STDIO or HTTP)',
                default: 'STDIO',
            }
        })
        .parseSync();

    return args as CliOptions;
}