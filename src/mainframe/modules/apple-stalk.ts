import * as net from 'net';
import { Module } from './base-module.js';
import * as db from '../system/clients.js';

/**
 * Imitation of a FTP server
 * Intentionally hackable via brute-force or any other method of obtaining valid auth tokens
 */

const version = "1.0.0"

function init(port:number):Module {
    const server = net.createServer();

    server.on('connection', (socket) => {
        socket.write(`APPLE STALK v${version}\n`);
        socket.write('AUTH:\n');
        let loggedIn = false;
        let client:db.Client = undefined;

        socket.on("error", (err:Error) => {
            console.log("err");
        })

        function handler(data) {
            if (!loggedIn) {
                let auth = data.toString('ascii');
                auth = auth.substring(0, auth.length - 1);
                let match = db.clients.filter(val => { return val.global_auth === auth });
                if (match.length === 0) {
                    socket.write('INVALID_AUTH\n');
                    socket.write('AUTH:\n');
                    return;
                }
                socket.write('OK\n');
                client = match[0];
                loggedIn = true;
                return;
            }

            let words = data.toString('ascii').match(/[a-z.]+/gi);
            if (!words) return;
            let str:string = words[0].toLowerCase();

            let numbers = data.toString('ascii').match(/\d+/);
            let number = undefined;
            if (numbers) {
                number = Number(numbers[0]);
            } 

            switch (str) {
                case "help":
                    socket.write("Browse your files.\n");
                    socket.write("HELP, GET $name, LIST, EXIT\n");
                    break;
                case "get":
                    if (words.length !== 2) {
                        socket.write("FILE_NOT_FOUND\n");
                        return;
                    }
                    let matches = client.files.filter(val => { return val.name === words[1] });
                    if (matches.length === 0) {
                        socket.write('FILE_NOT_FOUND\n');
                        return;
                    }
                    socket.write(matches[0].content + '\n');
                    break;
                case "list":
                    socket.write(client.files.map(val => { return val.name }).join(', ') + '\n');
                    break;  
                case "exit":
                    socket.end();
            }
        }

        socket.on("data", handler);
    });

    server.listen(port, "127.0.0.1", () => {});

    let module = new Module(port);
    module.trash = () => { server.close() };
    module.entry_point = -1;

    return module;
}

export { init };
