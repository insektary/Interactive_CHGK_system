var http = require('http');
var fs = require('fs');
var path = require('path');
var queryString = require('querystring');

var subscribers = {};
var mainSubscriber;
var protocol = {};
var questionNumber = 0;
var time;
var globalStatus = 'wait';
var answers = Object.create(null);

http.createServer(function (request, response) {
    var filePath = '.' + request.url;
    //Запрос на регистрацию
    if (request.url === '/registration') {
        var body = '';
        request.on('data', function(data) {
            body += data;
        });
        request.on('end', function() {
            var team = JSON.parse(body);
            answers[team.id] = 'none';
            if (!(team.id in protocol)) {
                protocol[team.id] = {};
                protocol[team.id].name = team.name;
                protocol[team.id].capitan = team.Player1;
                for (var key in team) {
                    if (key === 'name' || key === 'Player1' || key === 'id') continue;
                    protocol[team.id][key] = team[key];
                }
            }
            response.write(protocol[team.id].name);
            response.end();
        });
        return;
    }
    //Проверка на зарегестрированность
    if (request.url === '/iAmHere') {
        var stat = Object.create(null);
        var body = '';
        request.on('data', function(data) {
            body += data;
        });
        request.on('end', function() {
            if (body in protocol) {
                stat.register = 'yes';
            }
            else {
                stat.register = 'no';
            }
            stat.status = globalStatus;
            stat.time = time;
            stat.answer = answers[body];
            stat.number = questionNumber;
            response.end(JSON.stringify(stat));
        });
        return;
    }
    //Ожидание от игроков
    if (request.url === '/wait') {
        subscribers[request.connection.remoteAddress] = response;
        return;
    }
    //Ожидание от ведущего
    if (request.url === '/waitMain') {
        globalStatus = 'timerOn';
        mainSubscriber = response;;
        for (var user in subscribers) {
            response = subscribers[user];
            response.end('startTimer');  
        }
        if (time === undefined) {
            time = 60;
            var timerId = setInterval(function() {
                --time;
                if (time < 1) {
                    clearTimeout(timerId);
                    time = undefined;
                    globalStatus = 'wait';
                }
            }, 1000);
            return;
        }
    }
    //Получен ответ
    if (request.url === '/answer') {
        var body = '';
        request.on('data', function(data) {
            body += data;
        });
        request.on('end', function() {
            answers[body.slice(0,4)] = 'yes';
            mainSubscriber.end(body);
        });
        return;
    }
    //Следующий вопрос
    if (request.url === '/nextQuestion') {
        for (var key in answers) {
            answers[key] = 'none';
        }
        globalStatus = 'ready';
        mainSubscriber = response;
        ++questionNumber;
            for (var user in subscribers) {
                response = subscribers[user];
                response.end('nextQuestion' + questionNumber);  
            }
            response = mainSubscriber;
            response.end(JSON.stringify(protocol));
        return;
    }
    //Обновление таймера
    if (request.url === '/giveTime') {
        response.end('' + time);
        return;
    }
    //Конец игры
    if (request.url === '/endOfGame') {
        globalStatus = 'end';
        var body = '';
        request.on('data', function(data) {
            body += data;
        });
        request.on('end', function() {
            for (var user in subscribers) {
                response = subscribers[user];
                response.end('endOfGame');  
            }
        });
        var date = new Date();
        var fname = date.getDate() + '-' + (+date.getMonth() + 1) + '-' + date.getFullYear() + '.csv';
        fs.open(fname, 'w+', 0644, function(err, file_handle) {
            if (!err) {
                fs.write(file_handle, body, null, 'utf-8', function(err, written) {
                    if (!err) {
                        console.log('Успешно');
                    }
                    else {
                        console.log('Ошибка при записи');
                    }
                });
            }
            else {
                console.log('Ошибка при открытии');
            }
        });
        str = '';
        var num = 0;
        var count;
        var division;
        for (var key in protocol) {
            num++;
        }
        for (var i = 0; i < 11; i++) {
            switch (i) {
                case 0:
                    key = 'name';
                    break;
                case 1: 
                    key = 'capitan';
                    break;
                default: 
                    key = 'Player' + i;
            }
            count = 0;
            for (var key2 in protocol) {
                count++;
                division = (count < num) ? ';' : '\n';
                if (protocol[key2][key] === undefined) {
                    str += ' ' + division;
                }
                else {
                    str += protocol[key2][key] + division;
                }
            }
        }        
        fname = date.getDate() + '-' + (+date.getMonth() + 1) + '-' + date.getFullYear() + '-players' + '.csv';
        fs.open(fname, 'w+', 0644, function(err, file_handle) {
            if (!err) {
                fs.write(file_handle, str, null, 'utf-8', function(err, written) {
                    if (!err) {
                        console.log('Успешно');
                    }
                    else {
                        console.log('Ошибка при записи');
                    }
                });
            }
            else {
                console.log('Ошибка при открытии');
            }
        });
        return;
    }
    //Выдать страницу
    if (filePath == './')
        filePath = './index.html';

    if (filePath == './index.html' && request.connection.remoteAddress == '::1')
        filePath = './main.html';

    var extname = path.extname(filePath);
    var contentType = 'text/html; charset=utf-8';
    switch (extname) {
        case '.js':
            contentType = 'text/javascript';
            break;
        case '.css':
            contentType = 'text/css';
            break;
        case '.json':
            contentType = 'application/json';
            break;
        case '.png':
            contentType = 'image/png';
            break;      
        case '.jpg':
            contentType = 'image/jpg';
            break;
        case '.wav':
            contentType = 'audio/wav';
            break;
        case '.svg':
            contentType = 'image/svg+xml';
            break;
    }

    fs.readFile(filePath, function(error, content) {
        if (error) {
            if(error.code == 'ENOENT'){
                fs.readFile('./404.html', function(error, content) {
                    response.writeHead(200, { 'Content-Type': contentType });
                    response.end(content, 'utf-8');
                });
            }
            else {
                response.writeHead(500);
                response.end('Sorry, check with the site admin for error: '+error.code+' ..\n');
                response.end(); 
            }
        }
        else {
            response.writeHead(200, { 'Content-Type': contentType });
            response.end(content, 'utf-8');
        }
    });

}).listen(80);
console.log('Server running');
