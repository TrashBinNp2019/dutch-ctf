import { Module } from './general-module.js';
import * as db from '../system/clients.js';
import * as http from 'http';
import { promises as fs } from 'fs';
import { Wren } from '../../general/consts.js';


/**
 * Describes a subserver, hosting client's page.
 */
class Hosting {
    port:number;
    server:http.Server;
    client:string;
    running:boolean;
    visits:number;

    constructor(contents:string, client:string, host:string) {
        this.running = false;
        this.client = client;
        this.visits = 0;

        // pick 5 ports, then give up
        for (let i = 0; i < 5; i++) {
            this.port = Math.floor(Math.random() * (65535 - 1024) + 1024);
            this.server = http.createServer((req, res) => {
                this.visits++;
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(contents);
            });
            if (this.server.listen(this.port, host)) {
                this.running = true;
                break;
            }
        }
    }

    kill() {
        this.server.close();
        this.running = false;
    }
}

export function init(addr:string):Module {
    let hostings:Hosting[] = [];
    const server = http.createServer((req, res) => {
        let url = req.url.substring(0, (req.url + '?').indexOf('?'));;
        switch (url) {
            // front-end
            case '/': {
                if (req.method === 'GET') {
                    fs.readFile('src/static/wren/index.html')
                        .then(data =>{
                            res.setHeader("Content-Type", "text/html");
                            res.writeHead(200);
                            res.end(data);
                        }).catch(err => {
                            res.writeHead(500);
                            console.log(err);
                            return;
                        });
                }
                return;
            }
            // style
            case '/style.css': {
                if (req.method === 'GET') {
                    fs.readFile('src/static/wren/style.css')
                        .then(data =>{
                            res.setHeader("Content-Type", "text/css");
                            res.writeHead(200);
                            res.end(data);
                        }).catch(err => {
                            res.writeHead(500);
                            console.log(err);
                            return;
                        });
                }
                return;
            }
            // api for version req and onnection tests
            case '/api/version': {
                res.writeHead(200);
                res.end(Wren.VERSION);
                return;
            }
        }
        // api for hostings manipulation
        if (url.startsWith('/api/auth/')) {
            let auth = req.url.substring(10, 10 + db.GLOBAL_AUTH_LENGTH);
            let client = db.clients.filter(val => { return val.global_auth === auth });
            if (client.length !== 0) {
                if (req.method === 'GET') {
                    res.writeHead(200);
                    if (url.endsWith("/index")) {
                        res.end(JSON.stringify({
                            has: client[0].files.filter(val => { return val.name === "index.html" }).length !== 0,
                        }));
                        return;
                    } else if (url.endsWith("/service")) {
                        let hosting_mathces = hostings.filter(val => { return val.client === auth });
                        let up = hosting_mathces.filter(val => { return val.running }).length !== 0;
                        res.end(JSON.stringify({
                            up: up,
                            port: up? hosting_mathces[0].port : 0,
                            visits: up? hosting_mathces[0].visits : 0,
                        }));
                    } 
                    res.end("");
                    return;
                }
                if (req.method === 'PUT') {
                    let hosting_mathces = hostings.filter(val => { return val.client === auth });
                    if (hosting_mathces.filter(val => { return val.running }).length === 0) {
                        hostings = hosting_mathces.filter(val => { 
                            return val.running;
                        });
                        let file = client[0].files.find(val => { return val.name === "index.html" });
                        if (file === undefined) {
                            res.writeHead(400);
                            res.end(JSON.stringify({
                                error: "No index.html found",
                            }));
                            return;
                        }
                        let hosting = new Hosting(file.content, auth, addr);
                        setTimeout(() => {
                            if (hosting.running) {
                                hostings.push(hosting);
                                res.writeHead(200);
                                res.end();
                            } else {
                                res.writeHead(500);
                                res.end(JSON.stringify({
                                    error: "Service already running",
                                }));
                            }
                        }, 100);
                    } else {
                        res.writeHead(400);
                        res.end(JSON.stringify({
                            error: "Service already running",
                        }));
                    }
                    return;
                }
                if (req.method === 'DELETE') {
                    let hosting_mathces = hostings.filter(val => { return val.client === auth });
                    if (hosting_mathces.filter(val => { return val.running }).length !== 0) {
                        hostings = hosting_mathces.filter(val => { 
                            return val.running && val.client !== auth;
                        });
                        res.writeHead(200);
                        res.end("");
                    } else {
                        res.writeHead(400);
                        res.end(JSON.stringify({
                            error: "Service isn't running",
                        }));
                    }
                    return;
                }
            }
        }
        res.writeHead(404);
        res.end();
        return;
    });
    server.listen(Wren.PORT, addr);

    return new Module(Wren.PORT);
}