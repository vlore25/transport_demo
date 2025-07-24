//API KEY for tisseo 
const API_KEY = "76b5d53a-2130-4e1b-af48-46203bd7650a";

//Icons constants
const icons = {
    bus: `<img src="https://www.tisseo.fr/themes/tisseo_theme/images/picto/network/icone_bus.png">`,
    métro: `<img src="https://www.tisseo.fr/themes/tisseo_theme/images/picto/network/icone_metro.png">`,
    telepherique: `<img src="https://www.tisseo.fr/themes/tisseo_theme/images/picto/network/icone_telepherique.png">`,
    lineo: `<img src="https://www.tisseo.fr/themes/tisseo_theme/images/picto/network/icone_bus.png">`,
    navette: `<img src="https://www.tisseo.fr/themes/tisseo_theme/images/picto/cartouches/NVBOY.png">`,
    teleo: `<img src="https://www.tisseo.fr/themes/tisseo_theme/images/picto/cartouches/teleo.png">`
};

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

//Configuration for autoComplete.js
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

//Initilize instance for autoComplete.js
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
        return data;
    } catch (error) {
        console.error(error);
    }
}
//Process the json and each journey info
const getJourneysInfo = (data) => {
    if (!data?.routePlannerResult?.journeys) return [];

    return data.routePlannerResult.journeys.map(journeyContainer => {
        const journey = journeyContainer.journey;
        //Extract each journey line name and color
        const legs = journey.chunks
            .filter(chunk => chunk.service?.destinationStop?.line)
            .map(chunk => ({
                shortName: chunk.service.destinationStop.line.shortName,
                color: chunk.service.destinationStop.line.bgXmlColor || '#000000ff'
            }));

        // Extract transport methods
        const transportMethods = journey.chunks
            .filter(chunk => chunk.service?.destinationStop?.line?.transportMode?.name)
            .map(chunk => chunk.service.destinationStop.line.transportMode.name);

        // Extract departure time
        const departureTime = journey.departureDateTime;

        // Extract arrival time
        const arrivalTime = journey.arrivalDateTime
            ;
        // Extract each stop
        const stops = journey.chunks
            .filter(chunk => chunk.stop?.name)
            .map(chunk => chunk.stop.name);

        //Return array with journey info indexed
        return {
            legs: legs,
            transportMethods: [...new Set(transportMethods)],
            stops: stops,
            departureTime: departureTime,
            arrivalTime: arrivalTime
        };
    });
};



const displayRoutes = function (journeysInfo) {
    //Get the container element where the table will be placed
    const tableContainer = document.getElementById("table-section");

    //Build the HTML for the table rows (tbody content).
    let rowsHtml = '';
    journeysInfo.forEach((journey, index) => {
        const tMethodsHtml = journey.transportMethods.map(method => icons[method.toLowerCase()] || '?').join(``);
        const linesWColorsHTML = journey.legs.map(leg =>
            `<span class="line-badge" style="padding: 2px 6px; color: white; font-weight: bold; border-radius: 4px; background-color: ${leg.color};">${leg.shortName}</span>`
        ).join('<span class="line-separator"> <i class="bi bi-chevron-right"></i> </span>');
        const stopHTML = journey.stops.map(item => `<li>${item}</li>`).join('');
        const depart = journey.departureTime;
        const arrival = journey.arrivalTime;
        rowsHtml += `
            <tr data-bs-toggle="collapse" data-bs-target="#dropdown-${index}" class="ligne-cliquable">
                <td>${tMethodsHtml}</td>
                <td>${linesWColorsHTML}</td>
                <td>${depart}</td>
                <td>${arrival}</td>
                <td><i class="bi bi-chevron-down"></i></td>
            </tr>
            <tr>
                <td colspan="6" class="p-0">
                    <div id="dropdown-${index}" class="collapse">
                        <div class="p-3">
                            <h5>Arrêts de montée/descente :</h5>
                            <ul>${stopHTML}</ul>
                        </div>
                    </div>
                </td>
            </tr>`;
    });

    const TableHtml = `
        <table class="table table-hover mt-4">
            <thead>
                <tr>
                    <th>Mode</th>
                    <th>Lignes</th>
                    <th>Départ</th>
                    <th>Arrivée</th>
                </tr>
            </thead>
            <tbody>
                ${rowsHtml}
            </tbody>
        </table>
    `;

    // 4. Insert the complete table into the container.
    tableContainer.innerHTML = TableHtml;
};


const searchBtn = document.getElementById("search-btn");


const searchRoute = async function () {
    const departurePlace = document.getElementById("start-place").value;
    const arrivalPlace = document.getElementById("arrival-place").value;

    // To recovery journey data
    const journeyData = await journeysFetch(departurePlace, arrivalPlace);

    // Process the data into a clean format
    const journeysInfo = getJourneysInfo(journeyData);

    // Insert data in html using the new clean data
    displayRoutes(journeysInfo);
};
//Launch journey search
searchBtn.addEventListener("click", searchRoute);

//------------------Station info query----------------------///

// Fun to query places and return both label and id
const stopAreaQuery = async function (searchPlace) {
    try {
        const url = `https://corsproxy.io/?https://api.tisseo.fr/v2/places.json?term=${searchPlace}&displayOnlyStopAreas=1&key=${API_KEY}`;
        const reponse = await fetch(url);
        const data = await reponse.json();
        return data.placesList.place.map(element => ({
            label: element.label,
            id: element.id
        }));
    } catch (error) {
        console.log(error);
        return [];
    }
};

// Initilize instance for autoComplete.js for the stop search input
new autoComplete({
    selector: "#stop-input",
    data: {
        src: stopAreaQuery,
        keys: ["label"],
        cache: false,
    },
    resultItem: {
        highlight: true,
        content: (data, element) => {
            // Display the label in the results list
            element.innerHTML = data.match;
        }
    },
    threshold: 3,
    events: {
        input: {
            selection: (event) => {
                const selection = event.detail.selection.value;
                // Set input value to the place's label
                event.target.value = selection.label;
                // Store the selected stop's ID in a data attribute
                event.target.dataset.stopAreaId = selection.id;
            }
        }
    }
});


//Fun to get stop area departures info
const stopQuery = async function (stopAreaId) {
    //Get the data set with the stop area data from the stop-input field
    const stopAreadata = stopAreaId.dataset.stopAreaId;
    try {
        const url = `https://corsproxy.io/?https://api.tisseo.fr/v2/stops_schedules.json?stopAreaId=${stopAreadata}&key=${API_KEY}`;
        const reponse = await fetch(url);
        const data = await reponse.json();

        //Get departure lines
        const getDepartureLines = data.departures.departure.map(departure => ({
            lineId: departure.line.id,
            lineShortName: departure.line.shortName,
            lineColor: departure.line.bgXmlColor || '#000000ff'
        }));
        //Get departure times
        const getDepartureTimes = data.departures.departure.map(departure => {
            return departure.dateTime;
        });
        //Get departure terminus
        const getDepartureTerminus = data.departures.departure.map(departure => {
            return departure.destination.map(destination => {
                return destination.name;
            });
        })
        //Reagrouping departure time, lines and terminus for the stop area
        return {
            departLine: getDepartureLines,
            departTime: getDepartureTimes,
            departTerminus: getDepartureTerminus
        }
    } catch (error) {
        console.log(error);
    }
};



//get the transpot metod by line for icon reprentation
const tranportModeQuery = async function (stopqueryData) {
    const allDepartures = stopqueryData.departLine;
    //Debuggin :)
    //Get unique id by line to avoid to ask the server for duplicate information
    const uniqueLineIds = new Set(allDepartures.map(line => line.lineId));

    try {
        const linePromises = Array.from(uniqueLineIds).map(id => {
            const url = `https://corsproxy.io/?https://api.tisseo.fr/v2/lines.json?lineId=${id}&key=${API_KEY}`;
            return fetch(url).then(response => response.json());
        });
        const allLineDetails = await Promise.all(linePromises);
        const transportModeMap = new Map();
        allLineDetails.forEach(detail => {
            const line = detail.lines.line[0];
            transportModeMap.set(line.id, line.transportMode.name);
        });

        const orderedTransportModes = allDepartures.map(departure => {
            return transportModeMap.get(departure.lineId);
        });

        return orderedTransportModes;
    } catch (error) {
        console.error(error);
    }
};


const launchstopQuery = async function () {
    let rowsHtml = '';
    const tableContainer = document.getElementById("table-section-stop");
    const stopInput = document.getElementById("stop-input");
    const stopQueryData = await stopQuery(stopInput);
    const getTransportMethod = await tranportModeQuery(stopQueryData)
    const tMethodsHtml = getTransportMethod.map(method => icons[method.toLowerCase()] || '?');

    //Get each column info 
    //Get Departure Time
    const departLinesTime = stopQueryData.departTime;
    //Get lines Names 
    const departLinesName = stopQueryData.departLine.map(departLine => {
        return {
            name: departLine.lineShortName,
            color: departLine.lineColor
        }
    })
    //Get lines terminus
    const departLinesTerminus = stopQueryData.departTerminus.map(departTerminus => {
        return departTerminus[0];
    });
    departLinesTime.forEach((time, index) => {
        //Get the current line
        const lineInfo = departLinesName[index];
        //get the name and color
        const name = lineInfo.name;
        const color = lineInfo.color;

        //Get terminus and transport method
        const terminus = departLinesTerminus[index];
        const transport = tMethodsHtml[index];

        //Take name and color to create lines badge
        const lineBadge = `<span style="background-color: ${color}; color: white; padding: 2px 6px; border-radius: 4px; font-weight: bold;">${name}</span>`;

        rowsHtml += `<tr>
                    <td>${time}</td>
                    <td>${lineBadge}</td>
                    <td>${terminus}</td>
                    <td>${transport}</td>
                </tr>`;
    });

    const TableHtml = `
        <table class="table table-hover mt-4">
            <thead>
                <tr>
                    <th>Heure de depart</th>
                    <th>Ligne</th>
                    <th>Terminus</th>
                    <th>Mode de transport</th>
                </tr>
            </thead>
            <tbody>
                ${rowsHtml}
            </tbody>
        </table>
    `;
    tableContainer.innerHTML = TableHtml;
}

document.getElementById("search-stop-btn").addEventListener("click", launchstopQuery);

