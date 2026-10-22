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

fs.access(options.input, fs.contants.F_OK, (err) => {
   if (err) {
       console.error('Не знайдено вхідний файл')ж
       process.exitCode = 1;
       return;
}

  startServer();
});
