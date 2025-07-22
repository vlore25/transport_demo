//API KEY for tisseo.fr
const API_KEY = "76b5d53a-2130-4e1b-af48-46203bd7650a";

//Fun to query places
const placeQuery = async function (searchPlace) {
  try {
    const url = `https://corsproxy.io/?https://api.tisseo.fr/v2/places.json?term=${searchPlace}&key=${API_KEY}`;
    const reponse = await fetch(url);
    const data = await reponse.json();
    return data.placesList.place
            .filter(element => element.category === "Arrêts")
            .map(element => element.label);
  } catch (error) {
    console.log(error);
  }
};

//Create new instance of autoComplete.js
const autoCompleteConfig = {
    selector: ".autocomplete-input",
    data: {
        src: placeQuery,
        cache: false,
    },
    resultsList: {
        element: (list, data) => {
            if (!data.results.length) {
                const message = document.createElement("div");
                message.setAttribute("class", "no_result");
                message.innerHTML = `<span class="text-danger">Aucun résultat pour "${data.query}"</span>`;
                list.prepend(message);
            }
        },
        noResults: true,
    },
    resultItem: {
        highlight: true,
    },
    threshold: 3,
     events: {
        input: {
            selection: (event) => {
                const selection = event.detail.selection.value;
                event.target.value = selection;
            }
        }
    }
};


new autoComplete({
    ...autoCompleteConfig,
    selector: "#input-start",
});

new autoComplete({
    ...autoCompleteConfig,
    selector: "#input-end",
});

async function list() {
    try{ const url = `https://api.tisseo.fr/v2/journeys.json?departurePlace=basso%20cambo&arrivalPlace=fran%C3%A7ois%20verdier%20toulouse&key=${API_KEY}`;
    const reponse = await fetch(url);
    const data = await reponse.json();
    console.log(data.routePlannerResult.journeys[0]);
    } catch(error){
        console.log(error);
    }
}   
list();
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


