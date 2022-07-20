import * as dgram from 'node:dgram';
import { Entity } from './general-entity.js';
import { AppleStalk, Myrtle } from '../general/consts.js';
import * as db from '../mainframe/system/clients.js';
import * as fs from '../mainframe/system/files.js';
import { connect } from '../mainframe/modules/apple-stalk.js';
import * as saturn from '../general/saturn.js';

// UDP amplifier for all sorts of attacks
// All socket's output is shifted by random amount of bytes for funnier hacking and DOS-ing
// Operates analogously to the RPC

export function spawn(addr:string): Promise<Entity> {
    return new Promise<Entity>(async (resolve, reject) => {
        let logs = [];
        let shift = Math.floor(Math.random() * 251 + 100);
        let server = dgram.createSocket('udp4');
        let encoder = new TextEncoder();
        // TODO will not work since running on a different machine!
        let auth = db.addClient();
        let hash = fs.getFileByName('index.html').hash;
        
        let saturn_socket:saturn.SaturnSocket = undefined;
        try {
            saturn_socket = await saturn.init(addr, saturn.Type.service);
        } catch(e) {
            reject(new Error('Failed to initialise a saturn socket: ' + e.message));
        }
        let hub = (await saturn_socket.getHub()).addr;
        let hub_port = AppleStalk.PORT;
        
        function log(msg:string) {
            logs.push(new Date().toTimeString().split(' ')[0] + ': ' + msg);
        }
        
        server.on('message', (msg, rinfo) => {
            msg.toString('ascii').split(' ').map(val => val.replace('\n', '')).forEach(async arg => {
                let response = '';
                switch (arg.toLowerCase()) {
                    case 'clone': {
                        try {
                            let socket = await connect(hub, auth);
                            await new Promise<void>((resolve, reject) => {
                                socket.write('HASH ' + hash);
                                
                                socket.on('data', (data) => {
                                    if (data.toString('ascii').toLowerCase().includes('cloned index.html')) {
                                        response = 'Success';
                                        log(`Cloned index.html from ${hub}:${AppleStalk.PORT}`);
                                        resolve();
                                    } else {
                                        reject();
                                    }
                                });
                                socket.on('error', () => { reject(); });
                                setTimeout(reject, 2000);
                            });
                        } catch (e) {
                            response = 'Failure';
                            log(`Failed to clone index.html from ${hub}:${hub_port}`);
                        }
                        break;
                    }
                    case 'logs': {
                        response = logs.join('\n');
                        break;
                    }
                    default: {
                        response = Myrtle.HELP;
                    }
                }
                
                // Shifts each character except for newline, sends it back to the client
                server.send(
                    encoder.encode(response).map(val => val != 10? val + shift : val),
                    // encoder.encode(response),
                    0,
                    response.length,
                    rinfo.port,
                    rinfo.address,
                    (err) => {
                        if (err) {
                            console.log(err);
                        }
                    }
                    );
                });
            })
            
            try {
                server.bind(Myrtle.PORT, addr, () => {
                    log('Started');
                });
            } catch (e) {
                reject(new Error('Failed to bind a socket: ' + e.message));
            }
            
            const entity = new Entity(() => {
                server.close();
                saturn_socket.close();
            }, () => {
                return [
                    { port: Myrtle.PORT, usage: `Myrtle` },
                ];
            });
            resolve(entity);
    });
}
