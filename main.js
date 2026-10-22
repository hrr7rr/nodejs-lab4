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

const port = Number(options.port);

if (!Number.isInteger(port) || port<1 || port>65535) {
   console.error('Некоректний порт');
   process.exit(1);
}

fs.access(options.input, fs.contants.F_OK, (err) => {
   if (err) {
       console.error('Не знайдено вхідний файл');
       process.exitCode = 1;
       return;
}

  startServer();
});

function startServer() {
    const server = http.createServer((req, res) => {
        res.writeHead(200, {
            'Content-Type': 'application/json; charset=utf-8'
        });

        res.end(JSON.stringify({ message: 'Сервер працює' }));
    });

    server.on('error', (err) => {
        console.error('Помилка запуску сервера:', err.message);
        process.exitCode = 1;
    });

    server.listen(port, options.host, () => {
        console.log(`Сервер запущено: http://${options.host}:${port}`);
    });
}
