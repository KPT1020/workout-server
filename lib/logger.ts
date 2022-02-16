import bunyan from 'bunyan';

var log;

const init = (options) => {
    log = bunyan.createLogger({
        name: 'appLogger',
        level: 10
    });
    if(options.global){
        global.log = log;
    }

    return log;
}

module.exports.init = init;
module.exports.logObject = log;