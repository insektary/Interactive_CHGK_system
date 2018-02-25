'use strict'
var players = 1;
var xhr = new XMLHttpRequest();
var team = {};
var questionNumber = 0;
var myId;
var date = new Date;
var globalStatus = Object.create(null);

if (localStorage.getItem('id') == null) {
    myId = '' + date.getMilliseconds();
    localStorage.setItem('id', myId);
}
else {
    myId = localStorage.getItem('id');
}
while (myId.length < 4) {
    myId += 0;
}

xhr.open('POST', '/iAmHere', true);
xhr.send(myId);
xhr.onreadystatechange = function() {
    if (xhr.readyState != 4) return;
    if (xhr.status != 200) {
    }
    else {
        globalStatus = JSON.parse(xhr.responseText);
        if (globalStatus.status === 'end') {
            finishGame();
            return;
        }
        if (globalStatus.register === 'yes') {
            goToPlay();
            wait();
        }
        if (globalStatus.status === 'ready') {
            questionNumber = globalStatus.number;
            document.getElementsByClassName('counter')[0].innerText = 'Вопрос № ' + questionNumber;
        }
        if (globalStatus.status === 'timerOn') {
            questionNumber = globalStatus.number;
            document.getElementsByClassName('counter')[0].innerText = 'Вопрос № ' + questionNumber;
            timer(globalStatus.time);
        }
        if(globalStatus.answer === 'yes') {
            disableForm();
        }
    }
}

function addPlayer() {
    players++;
    var player = document.createElement('input');
    var contain = document.getElementsByClassName('list');
    player.type = 'text';
    player.placeholder = 'Игрок ' + players;
    var subtext = document.createElement('p');
    subtext.innerText = 'Игрок ' + players;
    contain[0].appendChild(player);
    contain[0].appendChild(subtext);
}

function signUp() {
    var inputs = document.getElementsByTagName('input');
    team.name = inputs[0].value;
    team.id = myId;
    for (var i = 1; i < inputs.length; i++) {
        team['Player' + i] = inputs[i].value;
    }
    var send = JSON.stringify(team);
    xhr.open('POST', '/registration', true);
    xhr.send(send);
    xhr.onreadystatechange = function() {
        if (xhr.readyState != 4) return;
        if (xhr.status != 200) {
            alert('error ' + xhr.status);
        }
        else {
            goToPlay();
            wait();
        }
    }
}

function goToPlay () {
    document.getElementsByClassName('command')[0].parentNode.removeChild(document.getElementsByClassName('command')[0]);
    document.getElementsByClassName('list')[0].parentNode.removeChild(document.getElementsByClassName('list')[0]);
    document.getElementsByClassName('buttons')[0].parentNode.removeChild(document.getElementsByClassName('buttons')[0]);
    document.getElementsByClassName('hi')[0].innerText = 'Команда зарегистрирована.';
    document.getElementsByClassName('hi')[0].className = 'hi1';
    var flex = document.createElement('div');
    flex.style.display = 'flex';
    document.getElementsByClassName('content')[0].appendChild(flex);
    var counter = document.createElement('div');
    counter.className = 'counter';
    counter.innerText = '';
    flex.appendChild(counter);
    var timer = document.createElement('div');
    timer.className = 'timer';
    timer.style.textAlign = 'right';
    timer.innerText = '';
    flex.appendChild(timer);
    var form = document.createElement('div');
    form.className = 'answer';
    document.getElementsByClassName('content')[0].appendChild(form);
    var area = document.createElement('textarea');
    area.disabled = 'disabled';
    area.style.borderRadius = '5px';
    area.style.backgroundImage = 'url("logo.svg")';
    form.appendChild(area);
    var submit = document.createElement('div');
    submit.className = 'buttons';
    document.getElementsByClassName('content')[0].appendChild(submit);
    var button = document.createElement('button');
    button.style.border = 'none';
    button.textContent = 'Ответить';
    button.onclick = sendAnswer;
    button.disabled = 'disabled';
    button.style.visibility = 'hidden';
    button.style.position = 'relative';
    button.style.left = 'calc(50% - ' + button.width/2 + 'px';
    submit.appendChild(button);
}

function wait() {
    xhr.open('GET', '/wait', true);
    xhr.send();
    xhr.onreadystatechange = function() {
        if (xhr.readyState != 4) return;
        if (xhr.status != 200) {
        }
        else {
            if(xhr.responseText.indexOf('nextQuestion') !== -1) {
                questionNumber = xhr.responseText.slice(12);
                document.getElementsByClassName('counter')[0].innerText = 'Вопрос № ' + questionNumber;
                document.getElementsByTagName('button')[0].innerText = 'Ответить';
            }
            else if (xhr.responseText === 'startTimer') {
                timer(60);
                return;
            }
            else if (xhr.responseText === 'endOfGame') {
                finishGame();
                return;
            }
        }
        wait();
    }
}

function disableForm() {
    document.getElementsByTagName('textarea')[0].disabled = 'disabled';
    document.getElementsByTagName('button')[0].disabled = 'disabled';
    document.getElementsByTagName('button')[0].innerText = 'Ответ отправлен!';
}

function sendAnswer() {
    var send = myId + document.getElementsByTagName('textarea')[0].value;
    xhr.open('POST', '/answer', true);
    xhr.send(send);
    disableForm();
    xhr.onreadystatechange = function() {
        if (xhr.readyState != 4) return;
        if (xhr.status != 200) {
        }
        else {
        }
    }
}

function timer(tm) {
    document.getElementsByTagName('textarea')[0].disabled = '';
    document.getElementsByTagName('button')[0].disabled = '';
    document.getElementsByTagName('button')[0].style.visibility = 'visible';
    var time = tm;
    document.getElementsByClassName('timer')[0].innerText = time;
    window.onfocus = function() {
        xhr.open('GET', '/giveTime', true);
        xhr.send();
        xhr.onreadystatechange = function() {
            if (xhr.readyState != 4) return;
            if (xhr.status != 200) {
                return;
            }
            else {
                if (xhr.responseText === '');
                else {
                    time = +xhr.responseText;
                }
            }
        }
    }
    var timerId = setInterval(function() {
        --time;
        document.getElementsByClassName('timer')[0].innerText = time;
        if (time < 1) {
            window.onfocus = null;
            clearTimeout(timerId);
            document.getElementsByTagName('textarea')[0].disabled = 'disabled';
            document.getElementsByTagName('button')[0].disabled = 'disabled';
            document.getElementsByTagName('button')[0].style.visibility = 'hidden';
            document.getElementsByClassName('timer')[0].innerText = '';
            document.getElementsByClassName('counter')[0].innerText = '';
            document.getElementsByTagName('textarea')[0].value = '';
            wait();
        }
    }, 1000);
}

function finishGame() {
    document.getElementsByTagName('textarea')[0].parentNode.removeChild(document.getElementsByTagName('textarea')[0]);
    document.getElementsByClassName('hi1')[0].parentNode.removeChild(document.getElementsByClassName('hi1')[0]);
    document.getElementsByClassName('game')[0].innerText = 'Спасибо за игру!';
    localStorage.clear();
}