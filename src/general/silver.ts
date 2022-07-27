import * as http from 'http';
import * as fs from 'fs';
import { Silver } from './consts.js';
import { SaturnSocket } from './saturn.js';
import { Entity } from '../entities/general-entity.js';

const Security = {
    // no filtering
    any: 'any',

    // only hub and loopback
    hub: 'hub',

    // only loopback
    loopback: 'loopback',
}
const sec = Security.any;


export function init(addr:string, saturn:SaturnSocket, entity:Entity) {
    if (sec !== Security.loopback) {
        console.log(`? Silver running in '${sec}' security mode`);
    }
    let index_html = '';
    let styles_css = '';
    let index_jsx = '';

    fs.readFile('src/static/silver/index.html', 'utf8', (err, data) => {
        if (err) throw err;
        index_html = data;
    });
    fs.readFile('src/static/silver/styles.css', 'utf8', (err, data) => {
        if (err) throw err;
        styles_css = data;
    });
    fs.readFile('src/static/silver/index.jsx', 'utf8', (err, data) => {
        if (err) throw err;
        index_jsx = data;
    });

    const listener = async (request, response) => {
        // console.log(request.socket.remoteAddress);
        if (sec === Security.loopback && 
            request.socket.remoteAddress !== '127.0.0.1' 
            ||
            sec === Security.hub &&
            request.socket.remoteAddress !== '127.0.0.1' &&
            request.socket.remoteAddress !== (await saturn.getHub()).addr) 
        {
            response.writeHead(403);
            response.end('Forbidden');
            return;
        }

        let path = request.url.substring(1);
        switch (path) {
            case '' :
            case 'index.html': {
                response.writeHead(200, { 'Content-Type': 'text/html' });
                response.end(index_html);
                return;
            }
            case 'styles.css': {
                response.writeHead(200, { 'Content-Type': 'text/css' });
                response.end(styles_css);
                return;
            }
            case 'index.jsx': {
                response.writeHead(200, { 'Content-Type': 'text/jsx' });
                response.end(index_jsx);
                return;
            }
        }
        if (path.startsWith('api/')) {
            switch (path) {
                case 'api/version': {
                    response.writeHead(200);
                    response.end(Silver.VERSION);
                    return;
                }
                case 'api/ports': {
                    response.writeHead(200);
                    response.end(JSON.stringify(entity.ports()));
                    return;
                }
            }
        }

        response.writeHead(404);
        response.end('Not found');
    };

    let server = http.createServer(listener);
    server.listen(Silver.PORT, '127.0.0.1');

    if (sec !== Security.loopback && addr !== '127.0.0.1') {
        let server = http.createServer(listener);
        server.listen(Silver.PORT, addr);
    }
}