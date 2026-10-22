import http from 'node:http';
import fs from 'node:fs';
import {Command} from 'commander';

const program = new Command();

program
    .helpOption('--help', 'Показати довідку')
    .requiredOption('-i, --input <path>', 'Файл даних')
    .requiredOption('-h, --host <address>', 'Адреса сервера')
    .requireOption('-p, --port<number>', 'Порт сервера')
    .option('-o, --outpt <path>', 'Файл відповіді');

program.parse();

const options = program.opts();
