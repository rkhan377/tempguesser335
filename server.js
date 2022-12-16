let portNumber=8000;


process.stdin.setEncoding("utf8");
if (process.argv.length != 2) {
  process.stdout.write(`Usage node summerCampServer.js`);
  process.exit(1);
}
console.log(`Web server started and running at http://localhost:${portNumber}`);
console.log("Type stop to shutdown the server: ");
process.stdin.on('readable', () => {
	let dataInput = process.stdin.read();
	if (dataInput !== null) {
		let command = dataInput.trim();
		if (command === "stop") {
			console.log("Shutting down the server");
            process.exit(0);
        } else {
			console.log(`Invalid command: ${command}`);
		}
        process.stdin.resume();
        console.log("Type stop to shutdown the server: ");
    }
});

const path = require("path");
const express = require("express"); /* Accessing express module */
const app = express();

require("dotenv").config({ path: path.resolve(__dirname, '.env') }) 
const userName = process.env.MONGO_DB_USERNAME;
const password = process.env.MONGO_DB_PASSWORD;
 /* Our database and collection */
 const databaseAndCollection = {db: process.env.MONGO_DB_NAME, collection:process.env.MONGO_COLLECTION};
/****** DO NOT MODIFY FROM THIS POINT ONE ******/
const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${userName}:${password}@cluster0.zg78onx.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

const countries = ["Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan", "Bolivia","Botswana", "Brazil", "Brunei", "Bulgaria", "Burundi", "Cambodia", "Cameroon", "Canada", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo", "Croatia", "Cuba", "Cyprus", "Denmark", "Djibouti", "Dominica", "Ecuador", "Egypt", "Eritrea", "Estonia", "Eswatini", "Ethiopia", "Fiji", "Finland", "France", "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guyana", "Haiti","Honduras", "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy", "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya", "Kiribati", "Kuwait", "Kyrgyzstan", "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg", "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Mauritania", "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar", "Namibia", "Nauru", "Nepal", "Netherlands", "Nicaragua", "Niger", "Nigeria", "Norway", "Oman", "Pakistan", "Palau", "Palestine", "Panama", "Paraguay", "Peru", "Philippines", "Poland", "Portugal", "Qatar", "Romania", "Russia", "Rwanda", "Samoa", "San Marino", "Saudi Arabia", "Senegal", "Serbia", "Singapore", "Slovakia", "Slovenia", "Somalia", "Spain", "Sudan", "Suriname", "Sweden", "Switzerland", "Syria", "Tajikistan", "Tanzania", "Thailand","Tonga","Tunisia", "Turkey", "Turkmenistan", "Tuvalu", "Uganda", "Ukraine", "Uae", "Uk", "Usa", "Uruguay", "Uzbekistan", "Vanuatu", "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe"];
const key = process.env.API_KEY;


app.set("views", path.resolve(__dirname, "templates"));

/* view/templating engine */
app.set("view engine", "ejs");



app.get("/", async(request, response) => {
    async function cl() {
        await client.connect();
          await clear(client, databaseAndCollection);
        }
        cl();
    
    response.render("welcome");
  
});

let citytemp = "";
let realtemp = "";
str = "http://api.weatherapi.com/v1/current.json?key="+key+"&q="+getCity();
console.log(str);
app.get("/game", (request, response) => {
    fetch(str).then(response => {
    return response.json();
}).then(res =>{
    citytemp = res.location.name;
    realtemp = res.current.temp_f;
    response.render("guess", {city: res.location.name, country: res.location.country, time: (res.location.localtime).slice(-5), cond: res.current.condition.text, image: res.current.condition.icon});
});
  
});

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended:false}));
app.post("/game", async (request, response) => {
    fetch("http://api.weatherapi.com/v1/current.json?key="+key+"&q="+getCity()).then(response => {
    return response.json();
}).then(res =>{
    async function add() {
        await client.connect();
         
          /* Inserting one movie */
          console.log("***** Inserting one movie *****");
          let guessIns = { city: citytemp, guess: request.body.guess, real: realtemp};
          await insert(client, databaseAndCollection, guessIns);
        }
        add();
    response.render("guessConf", {guess:request.body.guess,city: citytemp});
});
  
});

app.get("/results", async (request, response) => {
    arr = await lookUpMany(client, databaseAndCollection);
    let otab = "<table border=1><tr><th>City</th><th>Guess</th><th>Real Temp</th></tr>";
   // try {
     arr.forEach(element => {
       otab = otab+"<tr><td>"+String(element.city)+"</td><td>"+String(element.guess)+"</td><td>"+String((element.real))+"</td></tr>"
     });
   //} catch (error) {
   //  let element = ans[0]
   //  otab = otab+"<tr><td>"+String(element)+"</td><td>"+String(element.gpa)+"</td></tr>"
   //}
   /* Generating HTML */
   otab = otab + "</table>"
   const variables = 
    { 
     orderTable: otab
     };
    response.render("results", variables);
});


app.listen(portNumber);






function getCity(ans) {
    return countries[Math.floor(Math.random() * countries.length)];
}


//mongo functions
async function insert(client, databaseAndCollection, entry) {
    const result = await client.db(databaseAndCollection.db).collection(databaseAndCollection.collection).insertOne(entry);
    console.log(`entry created with id ${result.insertedId}`);
  }
  
  
  async function lookUpMany(client, databaseAndCollection) {
    let filter = {};
    const cursor = client.db(databaseAndCollection.db)
    .collection(databaseAndCollection.collection)
    .find(filter);
  
    // Some Additional comparison query operators: $eq, $gt, $lt, $lte, $ne (not equal)
    // Full listing at https://www.mongodb.com/docs/manual/reference/operator/query-comparison/
    const result = await cursor.toArray();
    console.log(result);
    return result
    //
  }
  
  async function clear(client, databaseAndCollection){
    const result = await client.db(databaseAndCollection.db)
    .collection(databaseAndCollection.collection)
    .deleteMany({});
  }
