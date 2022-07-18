import * as dgram  from 'dgram';
import { Saturn, AppleStalk } from '../general/consts.js';


/**
 * Describes an entry to the remote hosts' table
 */
export class Entry{
    addr:string; 
    type:string;
    frst:number;
    last:number;
    thrt:string;

    constructor(addr:string, type:string) {
        this.addr = addr;
        this.type = type;
        this.frst = Number(new Date());
        this.last = Number(new Date());
        this.thrt = Threat.none;
    }

    update():void {
        this.last = Number(new Date());
    }

    markSuspicious():void {
        this.thrt = Threat.suspicious;
        this.update();
    }

    markDangerous():void {
        this.thrt = Threat.dangerous;
        this.update();
    }
}

/** 
 * Utilizes two UDP sockets in Saturn protocol.
 * Can analyze machine's incoming traffic with analyze() method
 * Execution results are accessible via a table.
 */
export class SaturnSocket{
    socket: dgram.Socket;
    control_socket: dgram.Socket;
    table: Entry[];

    constructor(socket:dgram.Socket) {
        this.socket = socket;
        this.table = [];
    }

    knows(addr:string):boolean {
        let entry = this.table.find(val => val.addr === addr);
        return entry !== undefined;
    }

    getEntry(addr:string):Entry | undefined {
        let entry = this.table.find(val => val.addr === addr);
        return entry;
    }

    markSuspicious(addr:string) {
        let entry = this.table.find(val => val.addr === addr);
        if (entry === undefined) 
            return

        entry.markSuspicious();
    }

    markDangerous(addr:string) {
        let entry = this.table.find(val => val.addr === addr);
        if (entry === undefined) 
            return

        entry.markDangerous();

    }

    async getHub(): Promise<Entry> {
        return new Promise(async (resolve, reject) => {
            let hub = this.table.find(val => val.type === Type.hub);
            if (hub === undefined) {
                try {
                    hub = new Entry( 
                        await discoverHub(this.socket),
                        Type.hub,
                    );
                    this.table.push(hub);                
                } catch(err) {
                    reject(err);
                }
            }
            resolve(hub);
        });
    }
}

// Describes a message sent over UDP via the protocol
class Message{
    type:string;
    data:string;
    
    constructor(type:string, data:string) {
        this.type = type;
        this.data = data;
    }

    toString() {
        return JSON.stringify(this);
    }

    static fromString(data:string):Message {
        let obj = JSON.parse(data);
        let msg = new Message('', '');
        // TODO replace props if present
        return msg;
    }
}

// Enum for different execution modes.
export const Type = {
    hub: 'HUB',
    service: 'SRV',
    unspecified: 'USP',
    unknown: 'UKN',
}

// Enum for message types within the protocol
export const MSG = {
    INF: 'INF',
    CHK: 'CHK',
    ENT: 'ENT',
}

// Enum for perceived levels of threat 
export const Threat = {
    none: 'NON',
    suspicious: 'SSP',
    dangerous: 'DNG'
}

/**
 * Attempts to start a UDP socket and discover the hub. Once ready, resolves the promise with the socket wrapped.
 * @param addr Local address to listen on.
 * @param iface Interface to listen on.
 * @param type Type to assign to local machine. May be hub/service/unspecified - use Type enum.
 * @returns Promise, resolving to a wrapped socket.
 */
export function init(addr:string, type:string):Promise<SaturnSocket> {
    return new Promise(async (resolve, reject) => {
        let global_socket = dgram.createSocket('udp4');
        let control_socket = dgram.createSocket('udp4');
        let saturn_socket = new SaturnSocket(global_socket);
        try {
            global_socket.bind(Saturn.GPORT, addr, () => {
                global_socket.setBroadcast(true);
                global_socket.addMembership(Saturn.MCAST_ADDR, addr);
            });
        } catch(e) {
            reject('Unable to initiate global socket: ' + e);
        }
        try {
            control_socket.bind(Saturn.CPORT, addr);
        } catch(e) {
            reject('Unable to initiate global socket: ' + e);
        }

        if (type !== Type.hub) {
            try {
                let hub = new Entry(
                    await discoverHub(global_socket),
                    this.hub,
                );
                saturn_socket.table.push(hub);

                const msg = new Message(
                    MSG.CHK,
                    'ANY',
                ).toString();
                control_socket.send(
                    msg,
                    0,
                    msg.length,
                    Saturn.CPORT,
                    hub.addr,
                );
            } catch (e) {
                reject(e);
            }
        } 

        global_socket.on('message', (data, rinfo) => {
            const msg = Message.fromString(data.toString());
            let source = saturn_socket.table.find(val => val.addr === rinfo.address);

            // piece of code, called from various places throughout the following logic
            // practically goto 👎
            const changeType = (entry:Entry, type:string)  => {
                let new_type = msg.data;
                if (new_type !== Type.service && new_type !== Type.unspecified) {
                    new_type = Type.unknown;
                    entry.markSuspicious();
                }

                entry.type = type;
            }            

            switch (msg.type) {
                case (MSG.INF): {
                    if (msg.data !== Type.hub) {
                        if (source !== undefined) {
                            if (source.thrt === Threat.none) {
                                source.update();
                                changeType(source, msg.data);
                                if (
                                    type === Type.hub && 
                                    source.type === Type.service && 
                                    source.last - source.frst > 180
                                ) {
                                    let req = new Message(
                                        MSG.CHK,
                                        'ANY'
                                    ).toString();
                                    control_socket.send(
                                        req,
                                        0,
                                        req.length,
                                        Saturn.CPORT,
                                        Saturn.MCAST_ADDR,
                                    );
                                }
                            } else if (
                                source.thrt === Threat.suspicious &&
                                Number(new Date()) - source.last > 180
                            ){
                                source.thrt = Threat.none;
                                changeType(source, msg.data);
                            }
                        }
                        source = new Entry(rinfo.address, '');
                        changeType(source, msg.data);
                                        
                        saturn_socket.table.push(source);
                    }
                    // TODO if (msg.data === Type.hub)
                }
                default: {
                    source.markSuspicious();
                }
            }
        });

        control_socket.on('message', (data, rinfo) => {
            const msg = Message.fromString(data.toString());
            let source = saturn_socket.table.find(val => val.addr === rinfo.address);

            if (source !== undefined && source.thrt === Threat.none) {
                switch(msg.type) {
                    case (MSG.ENT): {
                        break;
                    }
                    case (MSG.CHK): {
                        if (source.type === Type.hub || source.type === Type.service) {
                            let res = '';
                            if (msg.data === 'ANY') {
                                res = JSON.stringify(saturn_socket.table)
                            } else {
                                let entries = saturn_socket.table.filter(val => val.addr === msg.data);
                                res = JSON.stringify(entries);
                            }

                            let resp = new Message(
                                MSG.ENT,
                                res,
                            ).toString();
                            control_socket.send(
                                resp,
                                0,
                                resp.length,
                                Saturn.CPORT,
                                rinfo.address,
                            );
                        }
                        break
                    }
                    default: {
                        source.markSuspicious();
                    }
                }
            }
        });

        let msg = JSON.stringify({
            type: MSG.INF, 
            data: type,
        });
        global_socket.send(
            msg,
            0,
            msg.length,
            Saturn.GPORT,
            Saturn.MCAST_ADDR,
        );
    });
}

/**
 * Attempts to discover local hub via Saturn protocol.
 * Assumes that the socket is a valid Saturn socket,
 * which should be true for sockets, created with init().
 * Times out in 2 seconds.
 * @param socket Saturn socket to use. Assumed to be valid.
 * @returns Promise, resolving to hub's local address if successful
 */
function discoverHub(socket:dgram.Socket):Promise<string> {
    return new Promise((resolve, reject) => {
             
    });
};