import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import api from '../api/api';

window.Pusher = Pusher;
Pusher.logToConsole = true;

// Because we don't have .env setup here yet, we will define defaults
// that can be customized easily if needed.
const REVERB_APP_KEY = '34390549805146d697e1';
const REVERB_HOST = '192.168.1.16';
const REVERB_PORT = 8080;
const REVERB_SCHEME = 'http';

const echo = new Echo({
    broadcaster: 'reverb',
    key: REVERB_APP_KEY,
    wsHost: REVERB_HOST,
    wsPort: REVERB_PORT,
    wssPort: REVERB_PORT,
    forceTLS: REVERB_SCHEME === 'https',
    enabledTransports: ['ws', 'wss'],
    authorizer: (channel, options) => {
        return {
            authorize: (socketId, callback) => {
                api.post('/broadcasting/auth', {
                    socket_id: socketId,
                    channel_name: channel.name
                })
                    .then(response => {
                        callback(false, response.data);
                    })
                    .catch(error => {
                        callback(true, error);
                    });
            }
        };
    },
});

window.Echo = echo;

export default echo;
