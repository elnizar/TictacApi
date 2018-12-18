
const express = require('express');
const jwt = require('jsonwebtoken');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(bodyParser.text());
var rateLimit = [];

const connection = mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: '',
    database: 'tictactrip'
});


connection.connect(function (err) {
    if (!err) {
        console.log("Database is connected ...");
    } else {
        console.log(err);
    }
});

app.get('/api', (req, res) => {
    res.json({
        message: 'Welcome to the API'
    });
});

app.post('/api/justify', verifyToken, (req, res) => {
    jwt.verify(req.token, 'secretkey', (err) => {

        // Check Authorization
        if (err) {
            res.sendStatus(403);
            return;
        }
        else {
            onJustifyVerified();
        }


    });

    function checkUserRates() {
        var textWords = req.body;

        var userRateLimit = rateLimit[req.token];

        if (!userRateLimit || !userRateLimit.date) {
            res.sendStatus(403);
            return false;
        }

        // Check words rate
        let userDay = userRateLimit.date.getDate();
        let currentDay = new Date().getDate();

        if (currentDay !== userDay) {
            userRateLimit.date = new Date();
            userRateLimit.words = 0;
        }
        //console.log(textWords.length);

        if (userRateLimit.words + textWords.length > 80000) {
            res.status(402).json({ message: '402 Payment Required.' });
            return false;
        }

        //console.log(textWords.length + userRateLimit.words);
        // Update words count
        userRateLimit.words = userRateLimit.words + textWords.length;

        rateLimit[req.token] = userRateLimit;

        return true;
    }

    function onJustifyVerified() {

        res.type("text/plain");

        // Check content
        var text = req.body;

        if (!text) {
            res.send('');
            return;
        }

        // Split text to words and check words count
        var textWords = text.replace(/\s\s+/g, ' ').split(/\n|\s/);
        if (!textWords.length) {
            res.send('');
            return;
        }

        // Check current user data
        if (!checkUserRates()) {
            return;
        }

        // Justify texts
        var paragaphs = text.split(/\n/);

        for (var i = paragaphs.length - 1; i >= 0; i--) {
            //console.log(paragaphs.length);

            var justifiedParagraph = justifyParagrpah(paragaphs[i]);
            if (!justifiedParagraph) {
                paragaphs.splice(i, 1);
            } else {
                paragaphs[i] = justifiedParagraph;
            }
        }

        res.send(paragaphs.join("\n"));
    }

    function justifyParagrpah(paragrahp) {
        paragrahp = paragrahp.replace(/\s\s+/g, ' ').trim();
        var paragrahpWords = paragrahp.split(/\s/);

        if (!paragrahp || !paragrahpWords.length) {
            return "";
        }

        // Create lines
        const MaxLineLength = 80;

        var newLines = [];
        var currentLineIndex = 0;
        for (var i = 0; i < paragrahpWords.length; i++) {
            // Init the new line
            if (!newLines[currentLineIndex]) {
                newLines[currentLineIndex] = "";
            }

            // Check caracteres limit
            var currentLine = newLines[currentLineIndex];
            var currentWord = paragrahpWords[i];
            if (currentWord.length + currentLine.length >= MaxLineLength) {
                //console.log(currentLine.length);
                currentLineIndex++;
                i--;
                continue;
            }

            if (currentLine) {
                currentLine += " ";
            }
            currentLine += currentWord;
            newLines[currentLineIndex] = currentLine;
        }

        for (var i = 0; i < newLines.length - 1; i++) {

            var line = newLines[i];
            // console.log(line.length);

            if (line.length >= MaxLineLength) {
                //console.log(line);
                continue;
            }
            var k = 1;
            for (var j = 0; j < line.length; j++) {

                if (line[j] == " " && line.length < MaxLineLength) {
                    line = setCharAt(line, j, "  ");
                    j = j + k;
                    //console.log(line.length);
                }
                if (j == line.length - 1 && line.length < MaxLineLength) {
                    j = 0;
                    k++;
                }
            }

            newLines[i] = line;


        }

        return newLines.join("\n");
    }

    function setCharAt(str, index, chr) {
        if (index > str.length - 1) return str;
        return str.substr(0, index) + chr + str.substr(index + 1);
    }


});


app.post('/api/token', (req, res) => {
    var sql = 'SELECT 1 FROM `user` WHERE email = ' + mysql.escape(req.query.email);

    function checkEmail(callback) {
        connection.query(sql, function (error, results, fields) {
            if (error) {
                console.log(error);
                callback();
            } else {
                callback(results.length);
            }
        });
    }

    checkEmail(function (authorized) {
        if (!authorized) {
            res.json({ message: 'Email not found.' });
            return;
        }

        const user = {
            email: req.query.email
        }

        jwt.sign({ user }, 'secretkey', { expiresIn: '24h' }, (err, token) => {
            rateLimit[token] = { words: 0, date: new Date() };
            //console.log(rateLimit[token]);
            res.json({
                token
            });
        });
    });
});

// FORMAT OF TOKEN
// authorization: <access_token>

// Verify Token
function verifyToken(req, res, next) {
    // Get auth header value
    const header = req.headers['authorization'];
    // Check if header is undefined
    if (typeof header !== 'undefined') {
        // Set the token
        req.token = header;
        // Next 
        next();
    } else {
        // Forbidden
        res.sendStatus(403);
    }

}

app.listen(3000, () => console.log('Server started on port 3000'));