function mapcat(fn, array) {
    return [].concat.apply([], array.map(fn));
}

const loadJson = async function (filename) {
    const statusEl = document.createElement('div');
    const statusLine = document.getElementById('status');
    statusLine.appendChild(statusEl);

    let response = await fetch(filename);
    const reader = response.body.getReader();
    // const totalK = Math.round(response.headers.get('Content-Length') / 1024); incorrect (gzip)
    let receivedLength = 0;

    let chunks = [];
    while (true) {
        const {done, value} = await reader.read();

        if (done) {
            break;
        }

        chunks.push(value);
        receivedLength += value.length;

        const recvK = Math.round(receivedLength / 1024);

        statusEl.innerText = `Loading ${filename}... ${recvK} KB`;
    }

    statusLine.removeChild(statusEl);

    let chunksAll = new Uint8Array(receivedLength); // (4.1)
    let position = 0;
    for (let chunk of chunks) {
        chunksAll.set(chunk, position); // (4.2)
        position += chunk.length;
    }

    let result = new TextDecoder("utf-8").decode(chunksAll);

    return JSON.parse(result);
};

const updateLocation = function () {
    navigator.geolocation.getCurrentPosition((position => {
        document.getElementById('lat').value = position.coords.latitude;
        document.getElementById('lon').value = position.coords.longitude;
    }));
};

function doSearch() {
    const res = document.getElementById("result");

    let searchResult = poiIndex.search(
        document.getElementById("search").value,
        parseFloat(document.getElementById("lat").value),
        parseFloat(document.getElementById("lon").value)
    );

    res.innerHTML = "";

    map.cleanMarkers();
    for (let i = 0; i < searchResult.length; i++) {
        const r = searchResult[i];
        const iDist = (r.dist / 1000).toFixed(2)
        const resItem = document.createElement('a');
        resItem.setAttribute('target', '_blank');
        resItem.setAttribute('href', `https://www.google.com/maps/search/${r.coords[0]},${r.coords[1]}`);
        resItem.textContent = `${r.title} – ${iDist} км.`;
        res.appendChild(resItem);
        const marker = map.addMarker(r);
        map.assignHover(resItem, marker);
    }
}


function loadData(prefix) {
    if (prefix === "") {
        prefix = "kyiv-center";
    }
    document.getElementById('search').disabled = true;

    loadJson(`data/${prefix}/objects.json`)
        .then(x => {
            poiIndex.indexObjects(x);
            map.arrangeCenter(Array.from(poiIndex.objects.values()));
        })
        .then(() => document.getElementById('search').disabled = false)
        .catch(e => {
            console.error(e);
            window.location.hash = ""
        });
}

let poiIndex;
let map = {
    map: null,
    markers: [],
    mainMarker: null,
    center: {
        lat: 50.4384911,
        lng: 30.488769
    },
    setMainMarker: (lat, lng) => {
        if (!map.map) return;
        if (map.mainMarker) {
            map.mainMarker.setMap(null);
        }

        document.getElementById('lat').value = lat;
        document.getElementById('lon').value = lng;
        map.mainMarker = new google.maps.Marker(
            {
                position: {lat: lat, lng: lng},
                map: map.map,
                icon: {
                    url: "https://maps.gstatic.com/mapfiles/ms2/micons/purple.png"
                }
            });
        if (map.markers.length > 0) {
            doSearch();
        }
     },
    cleanMarkers: () => {
        if (!map.map) return;
        map.markers.forEach((marker) => marker.setMap(null));
        map.markers = [];

    },
    addMarker: (item) => {
        if (!map.map) return;
        const marker = new google.maps.Marker(
            {
                position: {lat: item.coords[0], lng: item.coords[1]},
                icon: {
                    url: "https://maps.gstatic.com/mapfiles/ms2/micons/lightblue.png"
                },
                map: map.map})
        map.markers.push(marker);
        return marker;
    },
    arrangeCenter: (objects) => {
        if (!map.map) return;
        let latS = 0, lngS = 0, n = 0;
        for (let i = 0; i < objects.length; i++) {
            for (let j = 0; j < objects[i].coords.length; j++) {
                let c = objects[i].coords[j];
                latS += c[0];
                lngS += c[1];
                n++;
            }
        }
        const lat = latS / n;
        const lng = lngS / n;
        map.setMainMarker(lat, lng);
        map.map.setCenter({lat: lat, lng: lng});
    },
    assignHover : (el, marker) => {
        if (!map.map) return;
        el.addEventListener("mouseenter", e => {
            marker.setIcon({url: "https://maps.gstatic.com/mapfiles/ms2/micons/blue.png"});
        });
        el.addEventListener("mouseleave", e => {
            marker.setIcon({url: "https://maps.gstatic.com/mapfiles/ms2/micons/lightblue.png"});
        });
    }
}

function initMap() {
    map.map = new google.maps.Map(document.getElementById("map"), {
        center: map.center,
        zoom: 7,
    });
    map.map.addListener("click", e => map.setMainMarker(e.latLng.lat(), e.latLng.lng()));
}


