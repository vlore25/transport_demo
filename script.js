
//Create new instance of autoComplete.js
//const autoComplete = require("@tarekraafat/autocomplete.js");
//const autoCompleteJS = new autoComplete({ config });

//API KEY
const API_KEY = "76b5d53a-2130-4e1b-af48-46203bd7650a"


async function showinfo(searchPlace) {
    try{ const url = `https://corsproxy.io/?https://api.tisseo.fr/v2/places.json?term=${searchPlace}&key=${API_KEY}`;
    const reponse = await fetch(url);
    const data = await reponse.json();
    data.placesList.place.forEach(element => {
        return element.label;
    });
    } catch(error){
        console.log(error);
    }
}   


    document.getElementById('Input-start').addEventListener('input', function (evt) {
    if(this.value.length > 2){
    showinfo(this.value);
    }});


/*async function list() {
    try{ const url = `https://corsproxy.io/?https://api.tisseo.fr/v2/places.json?term=capitol&key=${API_KEY}`;
    const reponse = await fetch(url);
    const data = await reponse.json();
        console.log(data);
  
    } catch(error){
        console.log(error);
    }
}   
list();*/