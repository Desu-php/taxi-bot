const qrcode = require('qrcode-terminal');
const {Client, LocalAuth, Buttons} = require('whatsapp-web.js');
const MongoClient = require('mongodb').MongoClient;
const axios = require('axios');

const dbname = 'taxi';

const url = 'mongodb://heroku:f949H2FvNzxI@176.9.193.183:27017'

const prefix = 'tg'
API_TOKEN = '088fb89ca58b533e41ec68d84a354abe8e9dae3c3eb1731d17ef325493da0809cd8e3a9dbd2aa74ac222a3e5da92320ee7593c837a41536a50b3d25c7b208403'

async function getUsers() {
    const client2 = await MongoClient.connect(url, {useUnifiedTopology: true, useNewUrlParser: true})
        .catch(err => {
            console.log(err);
        });


    if (!client2) {
        return;
    }

    try {

        const db = client2.db(dbname);

        let collection = db.collection('users');
        return collection


    } catch (err) {

        console.log(err);
    } finally {


    }
}

function getChashID(userID) {
    console.log(userID)
    return `${prefix}_${userID}`
}

async function CheckExist(userID) {

    const count = await getUsers().then((user) => {

        return user.findOne({'cache_id': getChashID(userID)}).then((c) => {
            return c
        })

    })

    if (count == 0) {
        return false
    } else {
        return true
    }

}

async function apiRequest(mess, method, data) {
    const resp = await axios.default.post(`https://tb.e-aristotel.com/api/${method}`,
        Object.assign({'token': API_TOKEN, 'cache_id': getChashID(mess)}, data)).then(res => {
        res = res.data

        return res
    })
    console.log(resp)
    return resp

}

const client = new Client({
    authStrategy: new LocalAuth({
        clientId: "client-one"
    }),
    puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});



client.on('authenticated', (session) => {
    console.log('WHATSAPP WEB => Authenticated');
});

client.on('qr', (qr) => {
    // Generate and scan this code with your phone
    qrcode.generate(qr, {small: true});
});

client.on('ready', () => {
    console.log('Client is ready!');
});

// client.on('message', msg => {
//     if (msg.body == '!ping') {
//         msg.reply('pong');
//     }
// });

client.on('message', async msg => {
    console.log('message', msg)
    var userID;
    var chatID;
    await msg.getContact().then((prom) => {
        userID = prom.id.user

    })
    await msg.getChat().then((chat) => {
        chatID = chat.id._serialized
    })
    if (msg.body.substr(0, 6) == '/login') {
        let str = msg.body.split(" ")
        try {
            let login = str[1]
            let password = str[2]
            let resp
            try {
                resp = await apiRequest(userID, 'user_auth', {
                    'login': login,
                    'password': password
                }).then((res) => res).catch((res) => res)
            } catch (err) {
                client.sendMessage(chatID, "Ошибка, нет доступа к api " + err)

                // msg.reply("Ошибка, нет доступа к api "+err)
                return
            }
            if ("answer" in resp) {
                client.sendMessage(chatID, resp.answer)
                // msg.reply(resp.answer)
            } else if ("error" in resp) {
                client.sendMessage(chatID, resp.error)

                // msg.reply("Ошибка "+resp.error)
            } else {
                client.sendMessage(chatID, resp)
                // msg.reply("Ошибка "+resp)
            }


        } catch (err) {
            client.sendMessage(chatID, "не хватает параметров" + err)

            // msg.reply("не хватает параметров",err)
            return
        }
        return
    }


    CheckExist(userID).then(async (check) => {
        // return
        if (!check) {
            client.sendMessage(chatID, "Необходимо войти, отправьте мне команду /login <логин> <пароль>")
            // msg.reply('Необходимо войти, отправьте мне команду /login <логин> <пароль>')
            return
        }
        let resp
        try {
            console.log(userID)
            resp = await apiRequest(userID, 'in', {'input': msg.body}).then((res) => res).catch((res) => res)
        } catch (error) {
            client.sendMessage(chatID, "Ошибка, нет доступа к api")
            // msg.reply("Ошибка, нет доступа к api")
            return
        }

        if ("answer" in resp) {
            client.sendMessage(chatID, resp.answer)
            // msg.reply(resp.answer)
        } else if ("error" in resp) {
            client.sendMessage(chatID, "Ошибка " + resp.error)

            // msg.reply("Ошибка "+resp.error)
        } else {
            client.sendMessage(chatID, "Ошибка " + resp)
            // msg.reply("Ошибка "+resp)
        }
    })


});

client.initialize();