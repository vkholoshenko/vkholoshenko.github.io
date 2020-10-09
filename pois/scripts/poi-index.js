class TextHelper {
    static transliterate(str) {
        const cyr = TextHelper.cyrillicMapping;

        str = str.replace(/[ъь]+/g, '');

        return Array.from(str)
            .reduce((s, l) =>
                s + (
                    cyr.get(l)
                    || cyr.get(l.toLowerCase()) === undefined && l
                    || cyr.get(l.toLowerCase()).toUpperCase()
                )
                , '');
    }

    static normalizeString(word) {
        return TextHelper.transliterate(word.toLowerCase());
    }

    static similarity(normalizedText, normalizedRequests) {
        return normalizedRequests
            .map(req => normalizedText.indexOf(req) < 0 ? 0 : 1)
            .reduce((a, b) => a + b);
    }

    static bestMatch(texts, request) {
        const reqs = this.textToNormalizedWords(request);
        const ranks = texts.map(this.normalizeString).map(string => this.similarity(string, reqs));
        let bestMatch = 0;
        for (let i = 1; i < texts.length; i++) {
            if (ranks[i] > ranks[bestMatch]) bestMatch = i;
        }
        return texts[bestMatch];
    }

    static textToNormalizedWords(queryString) {
        return queryString.split(" ").map(TextHelper.normalizeString);
    }
}

TextHelper.cyrillicMapping = new Map([
    ['а', 'a'], ['б', 'b'], ['в', 'v'], ['г', 'g'], ['д', 'd'], ['е', 'e'],
    ['є', 'e'], ['ё', 'e'], ['ж', 'j'], ['з', 'z'], ['і', 'i'], ['и', 'i'], ['ї', 'yi'], ['й', 'i'],
    ['к', 'k'], ['л', 'l'], ['м', 'm'], ['н', 'n'], ['о', 'o'], ['п', 'p'], ['р', 'r'],
    ['с', 's'], ['т', 't'], ['у', 'u'], ['ф', 'f'], ['х', 'h'], ['ц', 'c'], ['ч', 'ch'],
    ['ш', 'sh'], ['щ', 'shch'], ['ы', 'y'], ['э', 'e'], ['ю', 'u'], ['я', 'ya'],
]);

function deg2rad(deg) {
    return deg * (Math.PI / 180)
}

function setIntersection(sets) {
    if (sets.length === 0) return new Set();
    const intersection = new Set(sets[0]);
    for (let i = 1; i < sets.length; i++) {
        for (let elem of intersection) {
            if (!sets[i].has(elem)) {
                intersection.delete(elem);
            }
        }
    }
    return intersection;
}

class PoiIndex {
    indexObjects(objects) {
        this.objects = new Map();
        this.trie = new Trie();

        for (const obj of objects) {
            this.objects.set(obj.id, obj);
            this.indexObject(obj);
        }
    }

    distanceInM(lat1, lon1, lat2, lon2) {
        const R = 6371; // Radius of the earth in km
        const dLat = deg2rad(lat2 - lat1);  // deg2rad below
        const dLon = deg2rad(lon2 - lon1);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2)
        ;
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const d = R * c; // Distance in km
        return d * 1000;
    }

    indexObject(object) {
        const objectId = object.id;
        let words = [...new Set(mapcat(TextHelper.textToNormalizedWords, object.names))];
        for (const word of words) {
            this.trie.addWord(word, objectId);
        }
    }

    static setIntersection(sets) {
    }

    search(searchString, lat, lon) {
        if (searchString.trim().length === 0) return [];

        const result = this.sort(this.filter(searchString), lat, lon);
        for (let i = 0; i < result.length; i++) {
            result[i].title = TextHelper.bestMatch(this.objects.get(result[i].id).names, searchString)
        }
        return result;
    }

    /**
     * @param {String} searchString
     * @returns {String[]} array of ids
     */
    filter(searchString) {
        const reqs = TextHelper.textToNormalizedWords(searchString);
        const founds = reqs.map(req => this.trie.getIds(req));

        const intersection = setIntersection(founds);
        return Array.from(intersection);
    }

    sort(ids, lat, lon) {
        const result = [];
        for (let i = 0; i < ids.length; i++) {
            const object = this.objects.get(ids[i]);
            const coords = object.coords;
            let minDistance = Infinity;
            let foundCoords;
            for (let j = 0; j < coords.length; j++) {
                const dst = this.distanceInM(coords[j][0], coords[j][1], lat, lon);
                if (dst < minDistance) {
                    foundCoords = coords[j];
                    minDistance = dst;
                }
            }
            result.push({
                id: object.id,
                dist: minDistance,
                coords: foundCoords
            });
        }

        result.sort((a, b) => a.dist - b.dist);
        return result.slice(0, 50);
    }
}
