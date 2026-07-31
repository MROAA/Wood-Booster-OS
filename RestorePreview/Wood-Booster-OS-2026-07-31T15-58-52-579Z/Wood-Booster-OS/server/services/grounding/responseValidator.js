export function validateResponse({
    answer,
    truth
}) {


    const truthText =
        JSON.stringify(truth)
        .toLowerCase();


    const suspicious = [];


    const sentences =
        answer
        .split(".")
        .map(sentence => sentence.trim())
        .filter(Boolean);



    for (const sentence of sentences) {


        const words =
            sentence
            .toLowerCase()
            .split(/\s+/);


        const knownWords =
            words.filter(word =>
                truthText.includes(word)
            );


        if (knownWords.length === 0) {

            suspicious.push(sentence);

        }

    }



    return {

        valid:
            suspicious.length === 0,

        suspicious

    };

}
