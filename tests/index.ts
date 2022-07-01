import { assert } from 'chai';
import { Socket } from 'net';
import { Module } from '../src/mainframe/modules/base-module.js';
import { init as witching_hour } from '../src/mainframe/modules/witching-hour.js';
import { init as apple_stalk } from "../src/mainframe/modules/apple-stalk.js";
import * as db from '../src/mainframe/system/clients.js';

/**
 * Function, that randomizes n characters in the base string. 
 * Used in apple-stalk test suite for brute-forcing authentication.
 * - May be rewritten in the future with a different algorithm for gerenating the string -
 * f.e. it can be passed as a parameter.
 * @param difficulty Number of characters to randomize
 * @param base String to randomize
 * @returns Base string with n random characters
 */
function randomAuth(difficulty:number, base:string) {
    return base.slice(0, base.length-difficulty) + Math.random().toString(16).substring(2, difficulty + 2);
};

// This suits should terminate the module, test that
// and procceed to creating a new module on the same port.
// However, damn net.Server does NOT close when I ask it to.
// bruh moment
suite('Witching Hour', () => {
    let module = witching_hour(3000, "this is a test");
    
    test('Module should be valid and accessible', function(){
        try{
            assert.isTrue(module instanceof Module);
            
            let socket = new Socket();
            socket.connect(module.port, '127.0.0.1');
            socket.on("error", (err:Error) => {
                assert.fail();
            });
            socket.on("data", () => {
                assert.isAbove(socket.bytesRead, 0);
            });
        } catch(e) {
            assert.fail();
        }
    });
});

suite('Apple Stalk', () => {
    let module = apple_stalk(3001);
    
    test('Module should be valid and accessible', function(){
        try{
            assert.isTrue(module instanceof Module);
            
            let socket = new Socket();
            socket.connect(module.port, '127.0.0.1');
            socket.on("error", (err:Error) => {
                assert.fail();
            });
            socket.on("data", (data) => {
                assert.isAbove(socket.bytesRead, 0);
            });
        } catch(e) {
            assert.fail();
        }
    });
    test('Should be accessible via auth token', function(){
        try{
            assert.isAbove(db.clients.length, 0);

            let socket = new Socket();
            socket.connect(module.port, '127.0.0.1');
            socket.on("error", (err:Error) => {
                assert.fail();
            });
            socket.on("data", (data) => {
                if (data.toString('ascii').includes("INVALID_AUTH")) {
                    assert.fail();
                } else if (data.toString('ascii').includes("AUTH:")) {
                    socket.write(db.clients[0].apple_stalk_auth + "\n");
                } else if (data.toString('ascii').includes("OK")) {
                    assert.isAbove(socket.bytesRead, 0);
                } else {
                    assert.fail();
                }
            });
        } catch(e) {
            assert.fail();
        }
    });

    // This test attempts brute-forcing the server for valid auth tokens.
    // My aim is for the whole operation to take around 5 minutes.
    // The test only guesses three characters of a token but isn't at all optimized.
    // Possible futher optimisation: make requests from several sockets, only use unique tokens.
    // The whole thing should be tested in the real world in order to make any assumtions.
    test('Should be moderately hackable', function(done){
        try{
            let socket = new Socket();
            socket.connect(module.port, '127.0.0.1');
            socket.on("error", (err:Error) => {
                assert.fail();
            });

            socket.on("data", data => {
                if (data.toString('ascii').includes("AUTH:")) {
                    socket.write(randomAuth(3, db.clients[0].apple_stalk_auth) + "\n");
                } else if (data.toString('ascii').includes("OK")) {
                    done();
                }
            });

        } catch(e) {
            assert.fail();
        }
    }).timeout(1000);
});
