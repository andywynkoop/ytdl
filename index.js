const express = require('express');
const app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const ytdl = require('ytdl-core');
const axios = require('axios');
app.use(express.static('public'));
app.use(cors());

Function.prototype.debounce = function(interval) {
	let timeout;
	return (...args) => {
		clearTimeout(timeout);
		timeout = setTimeout(() => this(...args), interval);
	};
};

const _emitProgress = (id, percentage) => {
	console.log(percentage);
	io.emit(id, percentage);
};

const emitProgress = _emitProgress.debounce(1000);

app.get('/songs/:filename', (req, res) => {
	const filePath = path.resolve(__dirname, 'public', req.params.filename);
	res.sendFile(filePath);
	setTimeout(() => {
		fs.unlink(filePath, err => {
			if (err) console.log(err);
			else console.log(`file removed at: ${filePath}`);
		});
	}, 60000);
});

app.get('/', (req, res) => {
	const { url, title, album_id, callback } = req.query;
	ytdl.getInfo(url, (err, info) => {
		if (err) throw err;
		const audio = ytdl.filterFormats(info.formats, 'audioonly');
		if (audio.length) {
			const itag = audio[0].itag;
			const extension = audio[0].container;
			const id = Math.floor(Math.random() * 1000000);
			res.json({ id });
			ytdl(url, { quality: itag })
				.on('progress', (_length, downloaded, totallength) => {
					const progressPercentage = Math.floor(
						(downloaded / totallength) * 100
					);
					emitProgress(id, progressPercentage);
				})
				.on('finish', () => {
					const url = callback;
					axios
						.post(url, {
							filename: `${id}.${extension}`,
							title,
							album_id,
						})
						.then(res => io.emit('newSong', res.data));
				})
				.pipe(fs.createWriteStream(`public/${id}.${extension}`));
		} else {
			res.status(422).json({ message: "Couldn't find audio" });
		}
	});
});

io.on('connection', socket => {
	io.emit('banana', { id: 4 });
});

server.listen(3001);
