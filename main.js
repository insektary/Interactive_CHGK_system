'use strict';
var questionNumber = 0;
var questionResult = {};
var time = 60;
var final = {};
var obj;
var numberOfTeams = 0;
var stringFile = '';

var timer = document.createElement('div');
timer.className = 'timer';
timer.innerText = '';
document.getElementsByClassName('system')[0].appendChild(timer);

var xhr = new XMLHttpRequest();
//Следующий вопрос
function nextQuestion() {
    if (questionNumber != 0)     countOneRes();
    var protocol = JSON.stringify(questionResult);
    localStorage.setItem('protocol', protocol);
    document.getElementsByTagName('button')[0].disabled = '';
    document.getElementsByTagName('button')[0].style.background = 'white';
    document.getElementsByTagName('button')[1].disabled = 'disable';
    document.getElementsByTagName('button')[1].style.background = 'rgb(202, 202, 202)';
    xhr.open('GET', '/nextQuestion', true);
    xhr.send();
    xhr.onreadystatechange = function() {
        if (xhr.readyState != 4) return;
        if (xhr.status != 200) {
            return;
        }
        else {
            var protocol = xhr.responseText;
            localStorage.setItem('list', protocol);
        }
    }
    ++questionNumber;
    document.getElementById('number').innerText = questionNumber;
}
//Запустить таймер
function startTimer() {
    time = 60;
    document.getElementsByTagName('button')[0].style.background = 'rgb(202, 202, 202)';
    document.getElementsByTagName('button')[1].style.background = 'rgb(202, 202, 202)';
    document.getElementsByTagName('button')[0].disabled = 'disable';
    document.getElementsByTagName('button')[1].disabled = 'disable';
    wait();
    var timerId = setInterval(function() {
        --time;
        document.getElementsByClassName('timer')[0].innerText = time;
        if (time < 1) {
            clearTimeout(timerId);
            document.getElementsByTagName('button')[0].style.background = 'rgb(202, 202, 202)';
            document.getElementsByTagName('button')[1].style.background = 'white';
            document.getElementsByTagName('button')[1].disabled = '';
            document.getElementsByTagName('button')[0].disabled = 'disable';
            document.getElementsByClassName('timer')[0].innerText = '';
        }
    }, 1000);
}
//Ожидание ответов
function wait() {
    xhr.open('GET', '/waitMain', true);
    xhr.send();
    xhr.onreadystatechange = function() {
        if (xhr.readyState != 4) return;
        if (xhr.status != 200) {
            return;
        }
        else {
            if (xhr.responseText != '') {
                addAnswer(xhr.responseText);
            }
        }
        wait();
    }
}
//Вывести ответ
function addAnswer(text) {
    var id = text.slice(0, 4);
    var answerBox = document.createElement('div');
    answerBox.onclick = changeStatus;
    answerBox.className = 'answer';
    answerBox.res = 'false';
    answerBox.style.background = 'rgb(255, 198, 198)';
    answerBox.id = id;
    answerBox.time = Date.now();
    document.getElementsByClassName('answers')[0].appendChild(answerBox);
    var answer = document.createElement('span');
    answer.innerText = text.slice(4);
    answer.id = 'span-' + id;
    answerBox.appendChild(answer);
    answer.innerText = text.slice(4);
}
//Пометить как верный или неверный
function changeStatus() {
    if (this.res === 'false') {
        this.style.background = 'rgb(208, 250, 208)';
        this.res = 'true';
    }
    else {
        this.style.background = 'rgb(255, 198, 198)';
        this.res = 'false';
    }
}
//Собрать результаты текущего вопроса и запихать в базу
function countOneRes() {
    questionResult[questionNumber] = {}
    var list = document.getElementsByClassName('answer');
    var i = 0;
    while (list[i] != undefined) {
        questionResult[questionNumber][list[i].id] = {};
        questionResult[questionNumber][list[i].id].textAnswer = document.getElementById('span-' + list[i].id).textContent;
        questionResult[questionNumber][list[i].id].time = list[i].time;
        questionResult[questionNumber][list[i].id].resolution = list[i].res;
        list[i].parentNode.removeChild(list[i]);
    }
}
//Завершить игру
function finishGame() {
    if (!confirm('Закончить игру и вывести результаты?')) {
        return;
    }
    else {
        countOneRes();
        var protocol = JSON.stringify(questionResult);
        localStorage.setItem('protocol', protocol);
        var subProto = JSON.parse(localStorage.getItem('list'));
        protocol = JSON.parse(localStorage.getItem('protocol'));
        for (var key in subProto) {
            ++numberOfTeams;
            final[subProto[key].name] = {};
            final[subProto[key].name].id = key;
            final[subProto[key].name].players = {};
            final[subProto[key].name].questions = {};
            for (var key2 in subProto[key]) {
                if (key2 === 'name') continue;
                final[subProto[key].name].players[key2] = subProto[key][key2];
            }
        }
        for (key in final) {
            for (var key2 in protocol) {
                for (var key3 in protocol[key2]) {
                    if (final[key].id == key3) {
                        final[key].questions[key2] = protocol[key2][key3];
                        break;
                    }
                }
            }
        }
        for (var i = 1; i <= questionNumber; i++) {
            for (var team in final) {
                if (final[team].questions[i] === undefined) {
                    final[team].questions[i] = {
                        textAnswer: '',
                        time: 0,
                        resolution: 'false'
                    }
                }
            }
        }
        countAll();
    }
}

function countAll() {
    for (var i = 1; i <= questionNumber; i++) {
        var arr = [];
        for (var key in final) {
            if  (final[key].questions[i].resolution === 'true') {
                arr.push(final[key].questions[i].time);
            }
        }
        arr = arr.sort();
        for (var key in final) {
            if (arr.indexOf(final[key].questions[i].time) === -1) {
                final[key].questions[i].bonuce = 0;
                continue;
            }
            final[key].questions[i].bonuce = 1 - Math.round((arr.indexOf(final[key].questions[i].time)/numberOfTeams)*100)/100;
        }
    }
    var arr = [];
    for (var key in final) {
        var sumOfBonuce = 0;
        var sumOfQuestions = 0;
        for (var key2 in final[key].questions) {
            sumOfBonuce += final[key].questions[key2].bonuce;
            if (final[key].questions[key2].resolution === 'true') {
                ++sumOfQuestions;
            }
        }
        if (arr.indexOf(sumOfBonuce) === -1) {
            arr.push(sumOfBonuce);
        }
        final[key].sumOfBonuce = sumOfBonuce;
        final[key].sumOfQuestions = sumOfQuestions;
    }
    arr = arr.sort();
    arr = arr.reverse();
    for (var key in final) {
        final[key].place = arr.indexOf(final[key].sumOfBonuce) + 1;
    }
    var results = document.getElementsByClassName('results')[0];
    for (var key in final) {
        var teamRes = document.createElement('div');
        teamRes.className = 'team';
        teamRes.id = key;
        teamRes.place = final[key].place;
        teamRes.onclick = showAnswers;
        var teamName = document.createElement('div');
        teamName.className = 'teamName';
        teamName.innerText = key;
        teamRes.appendChild(teamName);
        var diagram = document.createElement('div');
        diagram.className = 'diagram';
        diagram.innerText = final[key].place + ' / ' + final[key].sumOfBonuce;
        teamRes.appendChild(diagram);
        if (document.getElementsByClassName('team').length === 0) {
            document.getElementsByClassName('results')[0].appendChild(teamRes);
        }
        else {
            for (var i = 0; i < document.getElementsByClassName('team').length; i++) {
                if (+teamRes.place <= +document.getElementsByClassName('team')[i].place) {
                    document.getElementsByClassName('results')[0].insertBefore(teamRes, document.getElementsByClassName('team')[i]);
                    break;
                }
                else if (i === document.getElementsByClassName('team').length - 1) {
                    document.getElementsByClassName('results')[0].appendChild(teamRes);
                }
            }
        }
    }
    //Формируем будущий табличный файл
    stringFile = 'Название команды;';
    for (i = 1; i <= questionNumber; i++) {
        stringFile += i + ';';
    }
    stringFile += 'Правильные ответы;Очки;Место\n';
    for (var key in final) {
        stringFile += key + ';';
        for (var key2 in final[key].questions) {
            if (final[key].questions[key2].resolution === 'true') {
                stringFile += '+;';
            }
            else {
                stringFile += '-;';
            }
        }
        stringFile += final[key].sumOfQuestions + ';' + final[key].sumOfBonuce + ';' + final[key].place + '\n';
    }
    localStorage.setItem('final', JSON.stringify(final));
    xhr.open('POST', '/endOfGame', true);
    xhr.send(stringFile);
}
//Показать список ответов для возможного пересмотра
function showAnswers() {
    if (document.getElementById('list')) {
        document.getElementById('list').parentNode.removeChild(document.getElementById('list'));
    }
    if (final[this.id]) {
        obj = this;
    }
    else {
        obj = this.parentNode;
    }
    var list = document.createElement('div');
    list.id = 'list';
    list.style.position = 'absolute';
    list.style.border = 'solid 1px grey';
    list.style.borderRadius = '5px';
    list.style.left = obj.getBoundingClientRect().left + 'px';
    for (var key in final[obj.id].questions) {
        var answ = document.createElement('button');
        answ.className = 'miniList';
        answ.id = key;
        answ.onclick = replace;
        answ.innerHTML = '<span>' + key + ': ' + final[obj.id].questions[key].textAnswer + '</span>';
        answ.status = final[obj.id].questions[key].resolution;
        if (final[obj.id].questions[key].resolution === 'true') {
            answ.style.background = 'rgb(208, 250, 208)';
        }
        else {
            answ.style.background = 'rgb(255, 198, 198)';
        }
        list.appendChild(answ);
    }
    var append = document.createElement('button');
    append.className = 'miniList';
    append.innerText = 'Пересчитать';
    append.onclick = close;
    list.appendChild(append);
    document.getElementsByTagName('body')[0].appendChild(list);
    list.style.top = obj.getBoundingClientRect().top - list.clientHeight + 'px';
    for (var key of document.getElementsByClassName('team')) {
        key.onclick = null;
    }
}
//Закрыть список ответов
function close() {
    var container = document.getElementsByClassName('results')[0]
        while (container.firstChild) {
            container.firstChild.parentNode.removeChild(container.firstChild);
        } 
    countAll();
    document.getElementById('list').parentNode.removeChild(document.getElementById('list'));
    for (var key of document.getElementsByClassName('team')) {
        key.onclick = showAnswers;
    }
}
//Смена статуса ответа на апелляции
function replace() {
    if (this.status === 'true') {
        this.status = 'false';
        this.style.background = 'rgb(255, 198, 198)';
        final[obj.id].questions[this.id].resolution = 'false';
    }
    else {
        this.status = 'true';
        this.style.background = 'rgb(208, 250, 208)';
        final[obj.id].questions[this.id].resolution = 'true';
    }
}