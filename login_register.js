const express = require('express');
const fs = require('fs');
const app = express();
const PORT = 8080;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    var content = fs.readFileSync('index.html', 'utf8');
    res.send(content);
})

app.get('/login', (req, res) => {
    var content = fs.readFileSync('login.html', 'utf8');
    res.send(content);
});

app.get('/register', (req, res) => {
    var content = fs.readFileSync('register.html', 'utf8');
    res.send(content);
});

app.post('/login_submit', (req, res) => {
    var newData = req.body;
    var data = [];
    var success = false;
    if (fs.existsSync('user_data.json')) {
        var content = fs.readFileSync('user_data.json', 'utf8');
        if (content) {
            data = JSON.parse(content);
            for (var i = 0; i < data.length; i++) {
                if (data[i].username == newData.username && data[i].password == newData.password) {
                    success = true;
                }
            }
        }
    }
    if (success) {
        var html = `
        <!DOCTYPE html>
        <html>
            <body>
                <div style="border:4px solid black;padding:5px;width:400px;">
                    <h1>Login Successful!</h1>
                    <p> Welcome, ${newData.username}! </p>
                </div>
            </body>
        </html>`;
        res.send(html);
    } else {
        res.send("No such username/password combination exists!")
    }
});

app.post('/register_submit', (req, res) => {
    var newData = req.body;
    var data = [];
    var success = true;
    if (fs.existsSync('user_data.json')) {
        var content = fs.readFileSync('user_data.json', 'utf8');
        if (content) {
            data = JSON.parse(content);
            for (var i = 0; i<data.length; i++) {
                if (data[i].username == newData.username) {
                    success = false;
                }
            }
            if (success) {
                data.push(newData);
                fs.writeFileSync('user_data.json', JSON.stringify(data, null, 2));
            }
        }
    }

    if (success) {
        var dataText = ``;
        for (let i = 0; i < data.length; i++) {
            dataText += `<p> <span style="font-weight:bold;"> ${i+1}. </span> Username: ${data[i].username}, `;
            dataText += `Password: ${data[i].password}, </p>`;
        }
        var html = `
        <!DOCTYPE html>
        <html>
            <body>
                <div style="border:4px solid black;padding:5px;width:400px;">
                    <h1>Account created successfully!</h1>
                    ${dataText}
                </div>
            </body>
        </html>`;
        res.send(html);
    } else {
        res.send("Username already taken! Try again!")
    }
    
});

app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});
