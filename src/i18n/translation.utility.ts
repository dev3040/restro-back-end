export class Translation {
    static Translator(lang, file: string, variable: string, parameters: { toString(): string } = {}) {

        let jsonData: any;
        const langLowerCase = lang.toLowerCase();
        const filePath = `${process.cwd()}/src/i18n/${langLowerCase}/${file}.json`;
        jsonData = require(filePath);

        lang == "pt" && console.log("json data", jsonData);

        let msgData = jsonData[`${variable}`];
        if (!msgData) {
            jsonData = require(process.cwd() + `/src/i18n/en/${file}.json`);
            msgData = jsonData[`${variable}`];

            if (!msgData) {
                msgData = variable;
            }
        }

        function renderString(msg: string, object: any) {
            const regex = /\{([^{}]+)\}/g;
            return msg.replace(regex, (match, property) => {
                const trimmedProperty = property.trim();
                return object[trimmedProperty] !== undefined ? object[trimmedProperty] : match;
            });
        }

        if (msgData.includes('{')) {
            return renderString(msgData, parameters);
        } else {
            return msgData;
        }
    }
}
