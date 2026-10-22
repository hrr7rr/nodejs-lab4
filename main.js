
import http from 'node:http';
import fs from 'node:fs';
import { Command } from 'commander';

const program = new Command();

program.helpOption('--help', 'Показати довідку');
program.requiredOption('-i, --input <path>', 'Файл даних');
program.requiredOption('-h, --host <address>', 'Адреса сервера');
program.requiredOption('-p, --port <number>', 'Порт сервера');
program.option('-o, --output <path>', 'Файл відповіді');

program.parse();

const options = program.opts();

const port = Number(options.port);

if (!Number.isInteger(port) || port < 1 || port > 65535) {
    console.error('Некоректний порт');
    process.exit(1);
}

fs.access(options.input, fs.constants.F_OK, (err) => {
    if (err) {
        console.error('Cannot find input file');
        process.exitCode = 1;
        return;
    }

    startServer();
});

function sendResponse(res, status, data) {
    const answer = JSON.stringify(data);

    if (!options.output) {
        res.writeHead(status, {
            'Content-Type': 'application/json; charset=utf-8'
        });
        res.end(answer);
        return;
    }

    fs.writeFile(options.output, answer, 'utf8', (err) => {
        if (err) {
            const errorAnswer = JSON.stringify({
                error: 'Помилка запису файлу'
            });

            res.writeHead(500, {
                'Content-Type': 'application/json; charset=utf-8'
            });
            res.end(errorAnswer);
            return;
        }

        res.writeHead(status, {
            'Content-Type': 'application/json; charset=utf-8'
        });
        res.end(answer);
    });
}

function startServer() {
    const server = http.createServer((req, res) => {
        let url;

        try {
            url = new URL(req.url, `http://${options.host}:${port}`);
        } catch (err) {
            sendResponse(res, 400, { error: 'Некоректний URL' });
            return;
        }

        if (url.pathname !== '/') {
            sendResponse(res, 404, { error: 'Сторінку не знайдено' });
            return;
        }

        const showDate = url.searchParams.get('date') === 'true';
        const minText = url.searchParams.get('airtime_min');
        let minTime = null;

        if (minText !== null) {
            if (minText.trim() === '' || !Number.isFinite(Number(minText))) {
                sendResponse(res, 400, {
                    error: 'Параметр airtime_min повинен бути числом'
                });
                return;
            }

            minTime = Number(minText);
        }

        fs.readFile(options.input, 'utf8', (err, content) => {
            if (err) {
                sendResponse(res, 500, {
                    error: 'Помилка читання файлу'
                });
                return;
            }

            let flights = [];

            try {
                const lines = content.split(/\r?\n/);

                for (const line of lines) {
                    if (line.trim() !== '') {
                        flights.push(JSON.parse(line));
                    }
                }
            } catch (err) {
                sendResponse(res, 500, {
                    error: 'Пошкоджений файл даних'
                });
                return;
            }

            const result = [];

            for (const flight of flights) {
                const airTime = Number(flight.AIR_TIME);
                const distance = Number(flight.DISTANCE);

                if (flight.AIR_TIME === null ||
                    flight.AIR_TIME === '' ||
                    !Number.isFinite(airTime)) {
                    continue;
                }

                if (flight.DISTANCE === null ||
                    flight.DISTANCE === '' ||
                    !Number.isFinite(distance)) {
                    continue;
                }

                if (minTime !== null && airTime <= minTime) {
                    continue;
                }

                const item = {};

                if (showDate) {
                    item.date = flight.FL_DATE ?? null;
                }

                item.air_time = airTime;
                item.distance = distance;

                result.push(item);
            }

            sendResponse(res, 200, result);
        });
    });

    server.on('error', (err) => {
        console.error('Помилка запуску сервера:', err.message);
        process.exitCode = 1;
    });

    server.listen(port, options.host, () => {
        console.log(`Сервер запущено: http://${options.host}:${port}`);
    });
}
