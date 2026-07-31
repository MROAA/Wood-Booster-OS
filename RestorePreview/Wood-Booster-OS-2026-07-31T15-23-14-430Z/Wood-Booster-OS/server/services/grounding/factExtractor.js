export function extractFacts(truth) {

    if (!truth) {
        return {
            facts: [],
            missing: []
        };
    }


    const facts = [];


    function scan(value) {

        if (typeof value === "string") {
            facts.push(value);
        }


        if (Array.isArray(value)) {

            value.forEach(item => {
                scan(item);
            });

        }


        if (typeof value === "object" && value !== null) {

            Object.values(value).forEach(item => {
                scan(item);
            });

        }

    }


    scan(truth);


    return {

        facts,

        missing: []

    };

}
