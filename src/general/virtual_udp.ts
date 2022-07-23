let hosts:{ addr:string, ports:{ port:number, sockets:Socket[] }[] }[] = [];
let broadcasts:{ addr:string, ports:{ port:number, sockets:Socket[] }[] }[] = [];

export class RemoteInfo{
    address:string;
    family:string;
    port:number;
    size:number;
}

export class Socket{
    private callbacks:Map<string, ((...args:any[]) => void)[]>;
    private SO_BROADCAST:boolean;
    private port:number;
    private addr:string;

    constructor() {
        this.callbacks = new Map<string, ((...args:any[]) => void)[]>();
        this.callbacks.set("message", []);
        this.callbacks.set("close", []);
        this.callbacks.set("connect", []);
        this.callbacks.set("listening", []);
        this.callbacks.set("error", []);

        this.SO_BROADCAST = false;
        this.port = undefined;
        this.addr = undefined;
    }

    private emit(event:string, ...args:any[]) {
        if (this.callbacks.has(event)) {
            this.callbacks.get(event).forEach(element => element(...args));
        }
    }

    bind(port:number, addr:string, callback?:() => void):void {
        // TODO port = 0
        let host = hosts.find(val => val.addr === addr);
        if (host === undefined) {
            host = {
                addr: addr,
                ports: [],
            }
            hosts.push(host);
        }
        let host_port = host.ports.find(val => val.port === port);
        if (host_port === undefined) {
            host_port = {
                port: port,
                sockets: [],
            }
            host.ports.push(host_port);
        } 

        if (host_port.sockets.length === 0) {
            if (this.addr !== undefined) {
                let prev_host = hosts.find(val => val.addr === this.addr);
                if (prev_host !== undefined) {
                    let prev_host_port = prev_host.ports.find(val => val.port === this.port);
                    if (prev_host_port !== undefined) {
                        prev_host_port.sockets.splice(prev_host_port.sockets.indexOf(this), 1);
                    }
                }
                
                let prev_ports = broadcasts
                    .map(val => val.ports.find(val => val.port === this.port))
                    .filter(val => val !== undefined);
                prev_ports.forEach(val => val.sockets.splice(val.sockets.indexOf(this), 1));
            }
            host_port.sockets.push(this);

            this.port = port;
            this.addr = addr;
            this.emit('listening');
        } else {
            // TODO reuasable ports
            this.emit('error', new Error('Port unavailable'));
        }
        
        if (callback) {
            callback();
        }
    }

    setBroadcast(flag:boolean) {
        this.SO_BROADCAST = flag;
    }

    addMembership(addr:string, iface?:string) {
        if (this.port === undefined) {
            this.emit('error', new Error("Socket isn't bound"));
            return;
        }

        let group = broadcasts.find(val => val.addr === addr);
        if (group === undefined) {
            group = {
                addr: addr,
                ports: [],
            }
            broadcasts.push(group);
        }
        let socket_port = group.ports.find(val => val.port === this.port);
        if (socket_port === undefined) {
            socket_port = {
                port: this.port,
                sockets: [],
            }
            group.ports.push(socket_port)
        }
        socket_port.sockets.push(this);
    }

    send(msg:string, offset:number, length:number, dport:number, dst:string, ) {
        // TODO introduce realistic errors

        if (this.port === undefined || this.addr === undefined) {
            this.emit('error', new Error("Sending socket isn't bound"));
        }

        let recepient = hosts.find(val => val.addr === dst);
        let broadcast = false;
        if (recepient === undefined) {
            recepient = broadcasts.find(val => val.addr === dst);
            broadcast = true;
            if (recepient === undefined)
                return;
        }
        let port = recepient.ports.find(val => val.port === dport);
        if (port === undefined || port.sockets.length === 0) 
            return;

        // console.log(port.sockets);

        port.sockets.forEach(sock => {
            // TODO receive broadcast on loopback
            if (sock.addr !== this.addr && (!broadcast || sock.SO_BROADCAST === true)) {
                let rinfo:RemoteInfo = {
                    address: this.addr,
                    family: 'IPv4',
                    port: this.port,
                    size:length,
                };
                sock.emit('message', msg, rinfo);
            }
        });

        // if verbouse log the args
        // console.log(`${Number(new Date())}: ${this.addr} sent '${msg}' to ${dst}:${dport}`);
    }

    close(callback?:() => void) {
        if (this.addr !== undefined) {
            let prev_host = hosts.find(val => val.addr === this.addr);
            if (prev_host !== undefined) {
                let prev_host_port = prev_host.ports.find(val => val.port === this.port);
                if (prev_host_port !== undefined) {
                    prev_host_port.sockets.splice(prev_host_port.sockets.indexOf(this), 1);
                }
            }

            let prev_ports = broadcasts
                .map(val => val.ports.find(val => val.port === this.port))
                .filter(val => val !== undefined);
            prev_ports.forEach(val => val.sockets.splice(val.sockets.indexOf(this), 1));

            this.addr = undefined;
            this.port = undefined;
            this.emit('close');
            if (callback) {
                callback();
            }
        }
    }

    on(event:string, callback:(...args:any) => void):Socket {
        if (this.callbacks.has(event)) {
            this.callbacks.get(event).push(callback);
        }

        return this;
    }
}

export function createSocket(type?:string) {
    return new Socket();
}