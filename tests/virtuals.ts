import { assert } from 'chai';
import * as dgram from '../src/general/virtual_udp.js';
import * as saturn from '../src/general/saturn.js';
import { Saturn } from '../src/general/consts.js';


suite('Virtual UDP', () => {
    test('Should iniciate and close sockets correctly', function(done) {
        let socket1 = dgram.createSocket('udp4');
        let socket2 = dgram.createSocket('udp4');

        socket1.on("error", (err:Error) => {
            assert.fail(err.message);
        }).on("listening", () => {
            socket1.close();
        }).bind(3000, '1');

        socket2.on("error", (err:Error) => {
            assert.fail(err.message);
        }).on("listening", () => {
            socket2.close();
            done();
        }).bind(3000, '1');
    });

    test('Should send and receive data', function(done) {
        let sock1 = dgram.createSocket('udp4');
        let sock2 = dgram.createSocket('udp4');
        let sock3 = dgram.createSocket('udp4');

        sock1.on("error", (err:Error) => {
            assert.fail(err.message);
        }).on('message', (msg, rinfo) => {
            assert.isAbove(rinfo.port, 0);
            assert.equal(rinfo.address, '3');
            assert.equal(msg.toString('ascii'), 'TEST3');
            sock1.close();
            sock3.close();
            done();
        });

        sock2.on("error", (err:Error) => {
            assert.fail(err.message);
        }).on('message', (msg, rinfo) => {
            assert.fail("Closed sockets shouldn't receive data");
        });

        sock3.on("error", (err:Error) => {
            assert.fail(err.message);
        }).on("message", (msg:Buffer, rinfo:dgram.RemoteInfo) => {
            assert.deepEqual(msg.toString('ascii'), 'TEST1');
            let res = 'TEST3';
            sock3.send(res, 0, res.length, rinfo.port, rinfo.address);
            sock3.send(res, 0, res.length, 3029, '2');
        }).on("listening", () => {
            sock2.bind(3029, '2', () => {
                sock2.close();
            })

            sock1.bind(3015, '1', () => {
                sock1.send('TEST1', 0, 'TEST1'.length, 3000, '3');
            });
        }).bind(3000, '3');
    });

    test('Broadcast should work', function(done) {
        let sock1 = dgram.createSocket('udp4');
        let sock2 = dgram.createSocket('udp4');
        let sock3 = dgram.createSocket('udp4');
        let sock4 = dgram.createSocket('udp4');
        let sock5 = dgram.createSocket('udp4');
        let received = 0;
        
        sock1.on("error", (err:Error) => {
            assert.fail(err.message);
        });
        sock2.on("error", (err:Error) => {
            assert.fail(err.message);
        });
        sock3.on("error", (err:Error) => {
            assert.fail(err.message);
        });
        sock4.on("error", (err:Error) => {
            assert.fail(err.message);
        });
        sock5.on("error", (err:Error) => {
            assert.fail(err.message);
        });

        sock1.on("message", (msg:Buffer, rinfo:dgram.RemoteInfo) => {
            assert.isAbove(msg.length, 0);
            assert.deepEqual(msg.toString('ascii'), 'TEST');
            if (rinfo.address !== '2') {
                let res = 'TEST';
                sock1.send(res, 0, res.length, 3000, 'broadcast');
            }
        });
        sock2.on("message", (msg:Buffer, rinfo:dgram.RemoteInfo) => {
            assert.isAbove(msg.length, 0);
            assert.deepEqual(msg.toString('ascii'), 'TEST');
            let res = 'TEST';
            sock2.send(res, 0, res.length, 3000, 'broadcast');
        });
        sock5.on('message', (msg:Buffer, rinfo:dgram.RemoteInfo) => {
            assert.isAbove(msg.length, 0);
            assert.deepEqual(msg.toString('ascii'), 'TEST');
            received++;
            if (received === 3) {
                setTimeout(() => {
                    sock1.close();
                    sock2.close();
                    sock3.close();
                    sock5.close();
                    done();
                }, 10);
            }
            if (received > 3) {
                assert.fail('Received too many messages');
            }
        });
        sock3.on('message', (msg:Buffer, rinfo:dgram.RemoteInfo) => {
            assert.fail("Socket shouldn't receive messages when SO_BROADCAST is false");
        });
        sock4.on('message', (msg:Buffer, rinfo:dgram.RemoteInfo) => {
            assert.fail("Closed sockets shouldn't receive messages");
        }); 

        sock1.bind(3000, '1', () => {
            sock1.setBroadcast(true);
            sock1.addMembership('broadcast');
        });
        sock2.bind(3000, '2', () => {
            sock2.setBroadcast(true);
            sock2.addMembership('broadcast');
        });
        sock3.bind(3000, '3', () => {
            sock3.addMembership('broadcast');
        });
        sock4.bind(3000, '4', () => {
            sock4.setBroadcast(true);
            sock4.addMembership('broadcast');
            sock4.close();
        });
        sock5.bind(3000, '5', () => {
            sock5.setBroadcast(true);
            sock5.addMembership('broadcast');
            sock5.send('TEST', 0, 4, 3000, 'broadcast');
        });
    });
});

// saturn.ts should use virtual_udp.ts instead of node:dgram for tests to work
suite('Virtualised saturn', () => {
    let hub:saturn.SaturnSocket = undefined;
    let service1:saturn.SaturnSocket = undefined;

    test('Hub should be created correctly', (done) => {
        saturn.init('192.168.0.101', saturn.Type.hub)
        .then((socket:saturn.SaturnSocket) => {
            hub = socket;
            
            let sock = dgram.createSocket('udp4');
            sock.on('error', (err:Error) => {
                assert.fail(err.message);
            }).on('message', (data, rinfo) => {
                assert.equal(data.toString('ascii'), JSON.stringify({
                    type: saturn.MSG.INF,
                    data: saturn.Type.hub,
                }));
                sock.
                close();
                done();
            }).bind(Saturn.GPORT, '1', () => {
                sock.setBroadcast(true);
                sock.addMembership(Saturn.MCAST_ADDR);
            });
        }
        ).catch((err:Error) => {
            assert.fail(err.message);
        });
    });

    test('Services should start and identify the hub correctly', async () => {
        try {
            service1 = await saturn.init('192.168.0.11', saturn.Type.service);
            assert.isTrue(service1.hub_available);
            assert.equal((await service1.getHub()).addr, '192.168.0.101');
        } catch (err) {
            assert.fail(err.message);
        }
    }).timeout(3000);
});
