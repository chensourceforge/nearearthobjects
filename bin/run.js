const http = require('http');
const request = require('superagent');
const service = require('../server/service');

const intent = 'neo';
let port;

const server = http.createServer(service);

server.on('listening', () => {
    port = server.address().port;
    registerIntent();
    setInterval(registerIntent, 1000 * 60);
}).on('close', () => {
    request.
        delete(`127.0.0.1:3000/service/${intent}`).
        end((err, res) => {
            if(err) return console.error(err);
            console.log('delete sent');
        });
});

server.listen();

function registerIntent(){
    request.
        put(`127.0.0.1:3000/service/${intent}/${port}`).
        end((err, res) => {
            if(err) return console.error(err);
            console.log('registration sent');
        });
}