/*
 * Dev Studion live-esikatselun (Phase 7, osa C) reittipäättely.
 *
 * Selvittää minkä oikean sovelluksen reitin selain avaa esikatselua
 * varten, lukemalla oikean src/App.jsx:n tekstinä ja poimimalla siitä
 * regexeillä sen johdonmukaisen "import Name from './pages/File'" +
 * "<Route path=... element={<Name" -kaavan - ei aja mitään koodia, ei
 * tuo mitään moduulia, pelkkää tekstinkäsittelyä.
 *
 * Tarkoituksella suppea: kattaa vain sen mitä App.jsx tänään todella
 * käyttää (yksitasoiset "./pages/X"-tyyliset importit suoraan src/
 * -juuresta, tavalliset path-attribuutit ja yksi index-reitti). Jos
 * App.jsxin rakenne joskus muuttuu radikaalisti tästä kaavasta, tämä
 * yksinkertaisesti ei löydä osumaa - kutsuja putoaa silloin "root"-
 * varapolkuun, ei kaadu.
 */

function parseImports(appJsxSource) {

    const importRegex = /import\s+(\w+)\s+from\s+["'](\.[^"']+)["']/g

    const imports = []

    let match = importRegex.exec(appJsxSource)

    while (match) {

        imports.push({
            componentName: match[1],
            specifier: match[2],
        })

        match = importRegex.exec(appJsxSource)

    }

    return imports

}

function parseRoutes(appJsxSource) {

    const routeBlocks = appJsxSource.match(/<Route\b[\s\S]*?\/>/g) || []

    const routes = []

    for (const block of routeBlocks) {

        const normalized = block.replace(/\s+/g, " ").trim()

        const componentMatch = normalized.match(/element=\{\s*<(\w+)/)

        if (!componentMatch) {

            continue

        }

        const isIndex = /^<Route index\b/.test(normalized)

        const pathMatch = normalized.match(/path="([^"]+)"/)

        const routePath = isIndex ? "/" : pathMatch?.[1]

        if (routePath) {

            routes.push({
                componentName: componentMatch[1],
                routePath,
            })

        }

    }

    return routes

}

// App.jsx:n importit ovat aina muotoa "./pages/X" suoraan src/-juuren
// suhteen (App.jsx itse asuu src/App.jsx:ssä) - siksi tämä ei tarvitse
// mitään yleistä path.relative-päättelyä, riittää pudottaa "src/"-
// etuliite ja tiedostopääte.
function specifierForFile(filePath) {

    if (!filePath.startsWith("src/")) {

        return null

    }

    const withoutSrcPrefix = filePath.slice("src/".length)

    const withoutExtension = withoutSrcPrefix.replace(/\.(jsx|tsx|js|ts)$/i, "")

    return `./${withoutExtension}`

}

function findRoutePathForFile(filePath, imports, routes) {

    const specifier = specifierForFile(filePath)

    if (!specifier) {

        return null

    }

    const importEntry = imports.find(entry => entry.specifier === specifier)

    if (!importEntry) {

        return null

    }

    const route = routes.find(entry => entry.componentName === importEntry.componentName)

    return route ? route.routePath : null

}

/*
 * files: CodeChangeFileDraft-riveistä poimittu {filePath, action}-lista,
 * jo rajattu src/**-laajuuteen kutsujan toimesta (ks. previewSandbox.js).
 *
 * Palauttaa aina jonkin kohteen jos files ei ole tyhjä - "modify" jos
 * jokin muokattu tiedosto vastaa oikeaa reittiä (voittaa aina, koska
 * silloin Marc näkee muutoksen oikeassa kontekstissa), muuten "create"
 * jos suunnitelma sisältää uuden tiedoston (synteettinen render-reitti),
 * muuten "root" varapolkuna (esim. muokattu jaettu komponentti jolla ei
 * ole omaa sivua).
 */
function computePreviewTarget({ files, appJsxSource, port }) {

    const imports = parseImports(appJsxSource)

    const routes = parseRoutes(appJsxSource)

    const modifyFile = files.find(
        file => file.action !== "create" && findRoutePathForFile(file.filePath, imports, routes),
    )

    if (modifyFile) {

        const routePath = findRoutePathForFile(modifyFile.filePath, imports, routes)

        return {
            kind: "modify",
            routePath,
            url: `http://127.0.0.1:${port}${routePath}`,
        }

    }

    const createFile = files.find(file => file.action === "create")

    if (createFile) {

        return {
            kind: "create",
            routePath: "/__devstudio-preview/render",
            url: `http://127.0.0.1:${port}/__devstudio-preview/render?file=${encodeURIComponent(createFile.filePath)}`,
        }

    }

    if (files.length > 0) {

        return {
            kind: "root",
            routePath: "/",
            url: `http://127.0.0.1:${port}/`,
        }

    }

    return null

}

export {
    parseImports,
    parseRoutes,
    specifierForFile,
    computePreviewTarget,
}
