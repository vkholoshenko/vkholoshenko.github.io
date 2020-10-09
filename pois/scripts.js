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
    for (let i = 0; i < searchResult.length; i++) {
        const r = searchResult[i];
        const iDist = Math.round(r.dist);
        res.innerHTML +=
            (`<a target="_blank" href="https://www.google.com/maps/search/${r.coords[0]},${r.coords[1]}">` +
                `${r.title} – ${iDist} м.</a>`);
    }
}

function loadData(prefix) {
    if (prefix === "") {
        prefix = "kyiv-center";
    }
    document.getElementById('search').disabled = true;

    loadJson(`data/${prefix}/objects.json`)
        .then(x => poiIndex.indexObjects(x))
        .then(() => document.getElementById('search').disabled = false)
        .catch(e => {
            console.error(e);
            window.location.hash = ""
        });
}

const poiIndex = new PoiIndex();

window.onload = () => {
    updateLocation();
    setInterval(updateLocation, 5000);
    loadData(window.location.hash.substring(1));

    window.onhashchange = () => loadData(window.location.hash.substring(1));

    const searchInput = document.getElementById('search');
    searchInput.addEventListener('change', doSearch);
    searchInput.addEventListener('keyup', doSearch);
};

