import express from "express";
import morgan from "morgan";
import jsonfile from "jsonfile";

function generateBase64Id(length) {
	const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
	let result = "";
	for (let i = 0; i < length; i++) {
		const randomIndex = Math.floor(Math.random() * charset.length);
		result += charset[randomIndex];
	}
	return result;
}

const host = "0.0.0.0";
const port = 8000;

const app = express();

const urlJson = 'urls.json';

if (app.get("env") === "development") app.use(morgan("dev"));
app.use(express.static("static"));
app.set("view engine", "ejs");

app.use(express.urlencoded({ extended: true }));

app.get("/", async (request, response) => {
	const content = await jsonfile.readFile(urlJson);
	response.render("index", {url: [null, null, Object.keys(content).length]});
});

app.post("/shorten", async (request, response) => {
	const url = new URL(request.body.url);
	// lire le fichier json
	const content = await jsonfile.readFile(urlJson);
	console.log("ici", Object.keys(content).length);
	// vérifie que l'url n'a pas déjà un identifiant attribué
	const existingUrl = Object.keys(content).find(key => content[key] === url.href);
	if (existingUrl) {
		return response.render("index", {url: [`${host}:${port}`, `${existingUrl}`, Object.keys(content).length]});
	}
	// si ce n'est pas le cas, génère un nouvel identifiant
	// vérifie qu'il soit bien unique
	let existingId = true;
	let id;
	while (existingId) {
		id = generateBase64Id(5);
		existingId = Object.keys(content).find(key => key === id);
	}
	// ajoute dans la "base de donnée"
	content[id] = url.href;
	await jsonfile.writeFile(urlJson, content);
	return response.render("index", {url: [`${host}:${port}`, `${id}`, Object.keys(content).length]});
});


app.get("/:id", async (request, response) => {
	const id = request.params.id;
	const content = await jsonfile.readFile(urlJson);
	if (id in content) {
		response.redirect(content[id]);
	} else {
		response.status(404);
		response.render("error");		 
	}
});



const server = app.listen(port, host);

server.on("listening", () =>
	console.info(
		`HTTP listening on http://${host}:${port} with mode '${process.env.NODE_ENV}'`
	)
);
