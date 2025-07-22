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
    selector: "#start-place",
});

new autoComplete({
    ...autoCompleteConfig,
    selector: "#arrival-place",
});

//Fetch for journeys taking a depart and arrival place (stop point from the search-form)
const journeysFetch = async function (departurePlace, arrivalPlace) {
    try {
        const url = `https://api.tisseo.fr/v2/journeys.json?departurePlace=${departurePlace}&arrivalPlace=${arrivalPlace}&key=${API_KEY}`;
        const reponse = await fetch(url);
        const data = await reponse.json();
        console.log(data);
        
        return data;
    } catch (error) {
        console.error("A critical error occurred:", error);
    }
}

//Fun to recover transport methods
const transportMethods = async function (data) {
    return data.routePlannerResult.journeys.map(journeyContainer => {
        return journeyContainer.journey.chunks
            .filter(chunk => chunk.service)
            .filter(chunk => chunk.service.destinationStop.line)
            .filter(chunk => chunk.service.destinationStop.line.transportMode)
            .filter(chunk => chunk.service.destinationStop.line.transportMode.name)
            .map(chunk => chunk.service.destinationStop.line.transportMode.name);
    });
}

//Fun to recover lines shortname
const lines = async function (data) {
    return data.routePlannerResult.journeys.map(journeyContainer => {
        return journeyContainer.journey.chunks
            .filter(chunk => chunk.service?.destinationStop?.line)
            .map(chunk => chunk.service.destinationStop.line.shortName);
    });
}

const linesColor = async function (data) {
    return data.routePlannerResult.journeys.map(journeyContainer => {
        return journeyContainer.journey.chunks
            .filter(chunk => chunk.service?.destinationStop?.line)
            .map(chunk => chunk.service.destinationStop.line.bgXmlColor);
    });
}


//fun for insert route in display
const displayRoutes = async function (transportMethods, lines) {
    //Icons sources
    const icons = {
    bus:  `<img src="https://www.tisseo.fr/themes/tisseo_theme/images/picto/network/icone_bus.png">`,
    métro: `<img src="https://www.tisseo.fr/themes/tisseo_theme/images/picto/network/icone_metro.png">`,
    telepherique: `<img src="https://www.tisseo.fr/themes/tisseo_theme/images/picto/network/icone_telepherique.png">`,
    lineo: `<img src="https://www.tisseo.fr/themes/tisseo_theme/images/picto/network/icone_lineo.png">`,
    navette: `<img src="https://www.tisseo.fr/themes/tisseo_theme/images/picto/cartouches/NVBOY.png">`,
    teleo: `<img src="https://www.tisseo.fr/themes/tisseo_theme/images/picto/cartouches/teleo.png">`
    }
    //Insert table for line visualisation 
    let displaylignesTable = `<table class="table">
                            <thead>
                                <tr>
                                    <th>Mode de transport</th>
                                    <th>Numéro de ligne</th>
                                    <th>Arrêts desservis</th>
                                </tr>
                            </thead>
                            <tbody id="tbody-routes">
                            </tbody>
                        </table>`;
    document.getElementById("table-section").innerHTML = displaylignesTable;
    rowHtml = document.getElementById("tbody-routes");
    


    transportMethods.forEach((tMethod, index) => {
        //Remove duplicates 
        const uniqueMethods = [...new Set(tMethod)];
        //convert transport methods to icons using bracket notation
        const tMethodsHtml = uniqueMethods.map(method => {
        return icons[method.toLowerCase()] || '?';
        }).join(' → ');
        const journeyLines = lines[index]; 
        const linesHtml = journeyLines.join(' → ');
        rowHtml.innerHTML += `<tr>
                                <td>${tMethodsHtml}</td>
                                <td><span>${linesHtml}</span></td>
                              </tr>`;
    });

}


const searchBtn = document.getElementById("search-btn");


const searchRoute = async function () {
    const departurePlace = document.getElementById("start-place").value;
    const arrivalPlace = document.getElementById("arrival-place").value;
    const journeyData = await journeysFetch(departurePlace, arrivalPlace)
    const methods = await transportMethods(journeyData);
    const lineDetails = await lines(journeyData);
    displayRoutes(methods, lineDetails);

}

searchBtn.addEventListener("click", searchRoute);



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


