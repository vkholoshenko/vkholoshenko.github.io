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

    static buildTitle(titles) {
        let result = titles[0];
        if (titles.length > 1) {
            result = result + ' (' + titles.slice(1).join(', ') + ')';
        }
        return result;
    }
}

TextHelper.cyrillicMapping = new Map([
    ['а', 'a'], ['б', 'b'], ['в', 'v'], ['г', 'g'], ['д', 'd'], ['е', 'e'],
    ['є', 'e'], ['ё', 'e'], ['ж', 'j'], ['з', 'z'], ['і', 'i'], ['и', 'i'], ['ї', 'yi'], ['й', 'i'],
    ['к', 'k'], ['л', 'l'], ['м', 'm'], ['н', 'n'], ['о', 'o'], ['п', 'p'], ['р', 'r'],
    ['с', 's'], ['т', 't'], ['у', 'u'], ['ф', 'f'], ['х', 'h'], ['ц', 'c'], ['ч', 'ch'],
    ['ш', 'sh'], ['щ', 'shch'], ['ы', 'y'], ['э', 'e'], ['ю', 'u'], ['я', 'ya'],
]);