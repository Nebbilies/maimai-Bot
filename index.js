// Khai bao
const {Client, Intents, MessageEmbed, MessageButton} = require('discord.js');
const token = require('./config.js');
const sharp = require('sharp')
let fs = require('fs'),
    request = require('request');
let database = require("./maimai_songs.json");
const paginationEmbed = require("./discordjs-button-pagination");
// Create a new client instance
const allIntents = new Intents(32767);
const client = new Client({partials: ["CHANNEL"], intents: allIntents});

// Code tu duoi ready tro di
client.once('ready', () => {
    console.log('dmLam');
    client.user.setActivity('mm>help để biết thêm chi tiết!')
});

function makeid(length) {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
        result += characters.charAt(Math.floor(Math.random() *
            charactersLength));
    }
    return result;
}

search = (key, inputArray) => {
    for (let i = 0; i < inputArray.length; i++) {
        if (inputArray[i].title.toLowerCase().includes(key)) {
            return inputArray[i];
        }
    }
}
getRandom = (min, max) => {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
matchInputDiff = (difficulty) => {
}
// ---------------------Calculate Rating---------------------
songRatingCalculate = (constant, score) => {
    const ranks = [
        { title: "SSS+", minAchievement: 100.5, factor: 22.4 },
        { title: "SSS", minAchievement: 100.0, factor: 21.6 },
        { title: "SS+", minAchievement: 99.5, factor: 21.1 },
        { title: "SS", minAchievement: 99.0, factor: 20.8 },
        { title: "S+", minAchievement: 98.0, factor: 20.3 },
        { title: "S", minAchievement: 97.0, factor: 20.0 },
        { title: "AAA", minAchievement: 94.0, factor: 16.8 },
        { title: "AA", minAchievement: 90.0, factor: 15.2 },
        { title: "A", minAchievement: 80.0, factor: 13.6 },
        { title: "BBB", minAchievement: 75.0, factor: 12.0 },
        { title: "BB", minAchievement: 70.0, factor: 11.2 },
        { title: "B", minAchievement: 60.0, factor: 9.6 },
        { title: "C", minAchievement: 50.0, factor: 8.0 },
        { title: "D", minAchievement: 0.0, factor: 5.0 },
    ];
    score = parseFloat(score);
    constant = parseFloat(constant);
    const getRankByAchievement = (score) => {
        /*return ranks.find((rank) =>
        {
            score >= rank.minAchievement;
        });*/
        for (let i = 0; i < ranks.length; i++) {
            if (score >= ranks[i].minAchievement) {
                return ranks[i];
            }
        }
    }
    const rank = getRankByAchievement(score);
    const playRating = (score > 100.5) ? constant * (1.005 * rank.factor) : constant * (0.01 * score * rank.factor);
    const playRatingRounded = Math.floor(playRating);
    return playRatingRounded;
}


// ---------------------main---------------------
client.on('messageCreate', (message) => {
    if (message.content.startsWith("mm>info")) {
        let content = message.content.split(token.dmLam.prefix)[1].toLowerCase().split("info");
        let command = content[0];
        console.log(content);
        let channel = client.channels.cache.get(message.channelId);
        let songName = content[1].toLowerCase().trim();
        console.log(songName);
        let songData = search(songName, database);
        if (songData) {
            const songEmbed = new MessageEmbed()
                .setColor('#ffff7d')
                .setTitle(songData.title)
                //.setURL('https://discord.js.org/')
                .setAuthor({name: 'maimai Song Information', iconURL: 'https://i.imgur.com/T4KUA45.png'})
                .setDescription(songData.artist)
                //.setThumbnail('https://i.imgur.com/AfFp7pu.png')
                .addFields(
                    {name: 'Category:', value: songData.catcode},
                    {
                        name: 'Difficulties:',
                        value: `\n**Basic**: ${songData.dx_lev_bas || songData.lev_bas} \n\n**Expert**: ${songData.dx_lev_exp || songData.lev_exp}`,
                        inline: true
                    },
                    {
                        name: '\u200B',
                        value: `**Advanced**: ${songData.dx_lev_adv || songData.lev_adv} \n\n**Master**: ${songData.dx_lev_mas || songData.lev_mas}`,
                        inline: true
                    }
                )
                //.addField('Inline field title', 'Some value here', true)
                .setImage(`https://maimaidx-eng.com/maimai-mobile/img/Music/${songData.image_url}`)
            //.setTimestamp()
            //.setFooter({ text: 'Some footer text here', iconURL: 'https://i.imgur.com/AfFp7pu.png' });
            if (songData.dx_lev_remas || songData.lev_remas) {
                songEmbed.addFields({
                    name: '\u200B',
                    value: `**Re:Master**: ${songData.dx_lev_remas || songData.lev_remas}`
                })
            }

            channel.send({embeds: [songEmbed]});
            /* channel.send("**Song Title:** " + songData.title + "\n**Artist:** " + songData.artist + "**\nCategory:** "
                 + songData.catcode + "\n**_Difficulties:_** " + "\n**Basic:** " + songData.dx_lev_bas + "\n**Advanced**: "
             + songData.dx_lev_adv + "\n**Expert**: " + songData.dx_lev_exp + "\n**Master**: " + songData.dx_lev_mas +
                 `\nhttps://maimaidx-eng.com/maimai-mobile/img/Music/${songData.image_url}`)*/
        } else {
            return channel.send("Không thể tìm track trong database, vui lòng kiểm tra lại tên track.")
        }
    }
    else if (message.content.startsWith('mm>roulette')) {
        let embedArray = []
        let channel = client.channels.cache.get(message.channelId);
        let content = message.content.split(token.dmLam.prefix)[1].toLowerCase().split("roulette");
        let command = content[0];
        console.log(content);
        let diff = content[1].toLowerCase().trim();
        console.log(diff)
        let difficultyDX
        let difficultySTD
        let difficultyName
        let difficultyColor
        if (diff === 'basic' || diff === 'advanced' || diff === 'expert' || diff === 'master') {
            channel.send('**4 track được random của bạn là:**')
            for (let i = 0; i < 4; i++) {
                let songPick = getRandom(0, database.length)
                console.log(songPick)
                let songData = database[songPick]
                switch (diff) {
                    case 'basic':
                        difficultyDX = songData.dx_lev_bas
                        difficultySTD = songData.lev_bas
                        difficultyName = '**Basic: **'
                        difficultyColor = '#81d955'
                        break
                    case 'advanced':
                        difficultyDX = songData.dx_lev_adv
                        difficultySTD = songData.lev_adv
                        difficultyName = '**Advanced: **'
                        difficultyColor = '#f8b709'
                        break
                    case 'expert':
                        difficultyDX = songData.dx_lev_exp
                        difficultySTD = songData.lev_exp
                        difficultyName = '**Expert: **'
                        difficultyColor = '#ff818d'
                        break
                    case 'master':
                        difficultyDX = songData.dx_lev_mas
                        difficultySTD = songData.lev_mas
                        difficultyName = '**Master: **'
                        difficultyColor = '#c346e7'
                        break
                    /*   case 're:master':
                           difficultyDX = dx_lev_remas
                           difficultySTD = lev_remas
                           difficultyName = '**Re:Master: '
                           difficultyColor = '#ffffff'
                           break*/
                }
                console.log(songData)
                const songEmbed = new MessageEmbed()
                    .setColor(difficultyColor)
                    .setTitle(songData.title)
                    //.setURL('https://discord.js.org/')
                    .setAuthor({name: 'maimai Song Roulette', iconURL: 'https://i.imgur.com/T4KUA45.png'})
                    .setDescription(songData.artist)
                    .setThumbnail(`https://maimaidx-eng.com/maimai-mobile/img/Music/${songData.image_url}`)
                    .addFields(
                        {name: 'Category:', value: songData.catcode, inline: true},
                        {
                            name: difficultyName,
                            value: difficultyDX || difficultySTD,
                            inline: true
                        }
                    )
                    //.setImage(`https://maimaidx-eng.com/maimai-mobile/img/Music/${songData.image_url}`)
                //channel.send({embeds: [songEmbed]});
                embedArray[i] = songEmbed
            }
                channel.send({embeds: [embedArray[0],embedArray[1],embedArray[2],embedArray[3]]})
        } else if (diff === 're:master') {
            channel.send('**Re:master chưa được supported** vì hu ce gomenasorry')
        } else {
            channel.send('** Vui lòng pick 1 tên diff hợp lệ: BASIC, ADVANCED, EXPERT, MASTER.**')
        }
    }
    else if (message.content.startsWith('mm>diff')) {
        let songArray = [];
        let channel = client.channels.cache.get(message.channelId);
        let content = message.content.split(token.dmLam.prefix)[1].toLowerCase().split("diff");
        let command = content[0];
        let count = 0;
        let difficultyInput = content[1].toLowerCase().trim();
        let diffString = "1 2 3 4 5 6 7 7+ 8 8+ 9 9+ 10 10+ 11 11+ 12 12+ 13 13+ 14 14+ 15".split(" ");
        if(!diffString.includes(difficultyInput)) {
            return channel.send("**Diff không hợp lệ!**")
        }
        for (let i = 0; i < database.length; i++) {
            let songData = database[i]
            if (songData.dx_lev_bas === difficultyInput || songData.lev_bas === difficultyInput) {
                songArray.push({
                    songName: songData.title,
                    songDiff: 'BASIC'
                })
                count++
            } else if (songData.dx_lev_adv === difficultyInput || songData.lev_adv === difficultyInput) {
                songArray.push({
                    songName: songData.title,
                    songDiff: 'ADVANCED'
                })
                count++
            } else if (songData.dx_lev_exp === difficultyInput || songData.lev_exp === difficultyInput) {
                songArray.push({
                    songName: songData.title,
                    songDiff: 'EXPERT'
                })
                count++
            } else if (songData.dx_lev_mas === difficultyInput || songData.lev_mas === difficultyInput) {
                songArray.push({
                    songName: songData.title,
                    songDiff: 'MASTER'
                })
                count++
            } else if (songData.dx_lev_remas === difficultyInput || songData.lev_remas === difficultyInput) {
                songArray.push({
                    songName: songData.title,
                    songDiff: 'RE:MASTER'
                })
                count++
            }
        }
        songArray = songArray.reverse()
        //console.log(songArray)
        let songCount = songArray.length
        //channel.send('Có **' + songCount + ' bài ** với difficulty **' + difficultyInput + '**:')
        let iterateData = (e) => {
            return e.map((songArray) => `**${songArray.songName}** - ${songArray.songDiff}\n`).join("\n");
        }
        function createEmbed(page) {
            let top = songArray.slice((page-1)*10, (page-1)*10+10);
            return iterateData(top)
        }
        // riu page button
        const prev = new MessageButton()
            .setCustomId('previousbtn')
            .setLabel('Previous Page')
            .setStyle('PRIMARY');
        const next = new MessageButton()
            .setCustomId('nextbtn')
            .setLabel('Next Page')
            .setStyle('PRIMARY');
        let buttonList = [
            prev,
            next
        ]
        let p = [];
        //mmb
        for(let i=1;i<=Math.round((songArray.length/10)+0.4);i++) {
            let top = createEmbed(i);
            if(!(top === '')) {
                // noinspection JSCheckFunctionSignatures
                p[i-1] = new MessageEmbed()
                    .setAuthor({name:`Có ${songCount} bài với độ khó ${difficultyInput}:`})
                    .setDescription(`${top}`);
            }
        }
        message.reply('\u200b').then(function (message) {
            paginationEmbed(message, p, buttonList, 20000)
        });
        //channel.send('**' + nameArray[i] + '** - ' + diffArray[i])

    }
    else if (message.content.startsWith(`mm>random`)) {
        let songArray = [];
        let embedArray = [];
        let channel = client.channels.cache.get(message.channelId);
        let content1 = message.content.split(token.dmLam.prefix)[1].toLowerCase().split("random");
        if (content1[1] === '') {
            return channel.send("**Vui lòng nhập độ khó và số bài muốn random!**")
        } else {
        let content = content1[1].split(" ")
        let difficultyInput = content[1].toLowerCase().trim();
        console.log(difficultyInput)
        if (difficultyInput === '15') {
            content[2] = '1'
        }
            let count = content[2]
        console.log(count)
        console.log(content)
        let diffString = "1 2 3 4 5 6 7 7+ 8 8+ 9 9+ 10 10+ 11 11+ 12 12+ 13 13+ 14 14+ 15".split(" ");
        if(!diffString.includes(difficultyInput)) {
            return channel.send("**Diff không hợp lệ!**")
        }
        //songData là data lấy từ database để random
        for (let i = 0; i < database.length; i++) {
            let songData = database[i]
            if (songData.dx_lev_bas === difficultyInput || songData.lev_bas === difficultyInput) {
                songArray.push({
                    songName: songData.title,
                    songDiffName: 'BASIC',
                    songArtist: songData.artist,
                    songDiff: difficultyInput,
                    songCategory: songData.catcode,
                    diffColor: '#81d955',
                    image_url: songData.image_url
                })
            } else if (songData.dx_lev_adv === difficultyInput || songData.lev_adv === difficultyInput) {
                songArray.push({
                    songName: songData.title,
                    songDiffName: 'ADVANCED',
                    songArtist: songData.artist,
                    songDiff: difficultyInput,
                    songCategory: songData.catcode,
                    diffColor: '#f8b709',
                    image_url: songData.image_url
                })
            } else if (songData.dx_lev_exp === difficultyInput || songData.lev_exp === difficultyInput) {
                songArray.push({
                    songName: songData.title,
                    songDiffName: 'EXPERT',
                    songArtist: songData.artist,
                    songDiff: difficultyInput,
                    songCategory: songData.catcode,
                    diffColor: '#ff818d',
                    image_url: songData.image_url
                })
            } else if (songData.dx_lev_mas === difficultyInput || songData.lev_mas === difficultyInput) {
                songArray.push({
                    songName: songData.title,
                    songArtist: songData.artist,
                    songDiffName: 'MASTER',
                    songDiff: difficultyInput,
                    songCategory: songData.catcode,
                    diffColor: '#c346e7',
                    image_url: songData.image_url
                })
            } else if (songData.dx_lev_remas === difficultyInput || songData.lev_remas === difficultyInput) {
                songArray.push({
                    songName: songData.title,
                    songArtist: songData.artist,
                    songDiffName: 'RE:MASTER',
                    songDiff: difficultyInput,
                    songCategory: songData.catcode,
                    diffColor: '#ffffff',
                    image_url: songData.image_url
                })
            }
        }
        //songRandom là data đã được random
        let songRandom = [];
        let numRandom;
        console.log(songArray[0])
        let countCheck = '1 2 3 4'.split(" ")
            console.log(countCheck)
        if (!countCheck.includes(count)) {
            channel.send(`**Vui lòng chọn số bài từ 1 đến 4!**`)
            return;
        } else {
            count = parseInt(count)
            console.log(count)
            for (let countRandom = 0; countRandom < count; countRandom++) {
                numRandom = getRandom(0,songArray.length-1)
                console.log(`num random: ${numRandom}`)
                songRandom = songArray[numRandom]
                const songEmbed = new MessageEmbed()
                    .setColor(songRandom.diffColor)
                    .setTitle(songRandom.songName)
                    //.setURL('https://discord.js.org/')
                    .setAuthor({name: 'maimai Random Song', iconURL: 'https://i.imgur.com/T4KUA45.png'})
                    .setDescription(songRandom.songArtist)
                    .setThumbnail(`https://maimaidx-eng.com/maimai-mobile/img/Music/${songRandom.image_url}`)
                    .addFields(
                        {name: 'Category:', value: songRandom.songCategory, inline: true},
                        {
                            name: songRandom.songDiffName,
                            value: songRandom.songDiff,
                            inline: true
                        }
                    )
                //.setImage(`https://maimaidx-eng.com/maimai-mobile/img/Music/${songData.image_url}`)
                //channel.send({embeds: [songEmbed]});
                embedArray[countRandom] = songEmbed
            }
            count = count.toString()
            switch (count) {
                case '1':
                    channel.send({embeds: [embedArray[0]]})
                    break;
                case '2':
                    channel.send({embeds: [embedArray[0],embedArray[1]]})
                    break;
                case '3':
                    channel.send({embeds: [embedArray[0],embedArray[1],embedArray[2]]})
                    break;
                case '4':
                    channel.send({embeds: [embedArray[0],embedArray[1],embedArray[2],embedArray[3]]})
                    break;
                default:
                    console.log('nothing')
            }
        }
        }
    }
    else if (message.content === `mm>test`) {
        let channel = client.channels.cache.get(message.channelId);
        let songData = database[getRandom(0,database.length-1)]
        let fileDown = makeid(15)
        let fileUp = makeid(15)
        let topOffset = getRandom(0,250)
        let leftOffset = getRandom(0,250)

        const download = function (uri, filename, callback) {
            request.head(uri, function (err, res, body) {
                console.log('content-type:', res.headers['content-type']);
                console.log('content-length:', res.headers['content-length']);

                request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
            });
        };

        download('https://www.google.com/images/srpr/logo3w.png',
            `./image downloads/${fileDown}.png`, function(){
            console.log('done');
        });

        sharp(`C:\\Users\\Admin\\Desktop\\Projects\\206 Đường Meme\\hieutrung.jpg`)
            .extract({ left: leftOffset, top: topOffset, width: 400, height: 400 })
            .toFile(`./image saves/a.jpg`,
                function (err) {
                if (err) console.log(err);
            })
        message.channel.send({ files: [{ attachment: 'C:\\Users\\Admin\\Desktop\\Projects\\206 Đường Meme\\hieutrung.jpg' }] });
    }
    else if (message.content === `mm>kevindebruyne`) {
        let channel = client.channels.cache.get(message.channelId);
        channel.send({files: [{ attachment: 'C:\\Users\\Admin\\Desktop\\Projects\\206 Đường Meme\\zeiglerdebruyne.png'}]})
    }
    else if (message.content === 'mm>help') {
        let channel = client.channels.cache.get(message.channelId);
        channel.send('**Hiện tại bot support 3 command:** ' +
            '\n\n`mm>info [Tên đầy đủ hoặc 1 phần tên bài]`: đưa ra toàn bộ thông tin về bài đó bao gồm ' +
            '**title, artist, category và các diff**. \n\n`mm>roulette [Tên diff]`: **Random 4 bài bất kì với tên diff đã chọn**' +
            ' để pick khi ae quá chán abcdxyz.' + '\n\n`mm>diff [Độ khó]`: Đưa ra list **tất cả** bài với độ khó đã chọn.' +
            '\n\n`mm>random [Độ khó] [Số bài]`: Random **số bài** trong **độ khó** đã chọn.')
    }
    else if (message.content.startsWith("mm>calculate")) {
        let channel = client.channels.cache.get(message.channelId);
        let content = message.content.split(' ');
        if (content[1] == null || content[2] == null) {
            return channel.send("**Vui lòng nhập đủ thông tin!\n\n`mm>calculate [Constant] [Score]`\n\n ex: `mm>calculate 13.8 100.73`**")
        }
        console.log(content);
        let constant = content[1];
        let score = content[2];
        if (constant < 1.0 || constant > 15.0) {
            return channel.send("**Constant không hợp lệ!\n\n`mm>calculate [Constant] [Score]`\n\n ex: `mm>calculate 13.8 100.73`**")
        }
        if (score < 0 || score > 101.0) {
            return channel.send("**Score không hợp lệ!\n\n`mm>calculate [Constant] [Score]`\n\n ex: `mm>calculate 13.8 100.73`**")
        }
        const calculatedSongRating = songRatingCalculate(constant, score);
        console.log(calculatedSongRating);
        return channel.send("_Đạt **" + score + "%** trên một chart **" + constant + "** sẽ có rating là: **" + calculatedSongRating + "**_")
    }
    else {
        let channel = client.channels.cache.get(message.channelId);
        return; //channel.send("Hiện tại bot chỉ support **mm>info [Tên bài]**, vui lòng nhập đúng command.")
    }
    /*  if (message.author.id === '352668108860817418') {
       message.reply('<@204135451135705089> dm Satxri')
   }*/
})
// Dong login luon la dong cuoi cung
client.login(token.dmLam.token);

