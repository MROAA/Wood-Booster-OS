/**
 * Hearthwood Trust Policy V4. Source-linked, conservative, read-only answers.
 * AI prose is NEVER promoted to a verified fact by this module.
 */
function text(value) { return typeof value === 'string' ? value : '' }
function safeCodeName(value) { return /^[A-Za-z_$][\w$]*$/.test(text(value)) }
function safePath(value) { return /^src\/[A-Za-z0-9_./-]+\.(?:js|jsx|ts|tsx)$/.test(text(value)) && !value.split('/').includes('..') }

export function buildSourceOnlyAnswer({ verifiedSources = [], dependencySources = [], missingSymbols = [], callSiteVerification = null } = {}) {
  if (callSiteVerification) {
    const matches = Array.isArray(callSiteVerification.matches) ? callSiteVerification.matches : []
    if (!matches.length) return [
      '**Mitä lähdekoodista selviää**',
      callSiteVerification.status === 'NOT_CHECKED'
        ? 'Kutsukohtien tarkistus ei onnistunut. Vahvistettuja tuloksia ei ole.'
        : 'Tutkituista tiedostoista ei löytynyt vahvistettua suoraa kutsukohtaa.',
      '',
      '**Mikä jäi epävarmaksi**',
      'Tästä ei voi päätellä, ettei funktiota käytetä. Koko projektia, aliasviittauksia tai dynaamisia kutsuja ei ole tarkistettu.',
    ].join('\n')
    const facts = matches.slice(0, 10).filter(x => safeCodeName(x.symbol) && safePath(x.filePath) && Number.isInteger(x.line) && x.line > 0)
      .map(x => `- **${x.symbol}**: ${x.caller && safeCodeName(x.caller) ? `kutsuva funktio **${x.caller}**` : 'kutsuvaa funktiota ei voitu varmasti nimetä'}, ${x.filePath}, rivi ${x.line}.`)
    return [
      '**Vahvistetut kutsukohdat**',
      ...facts,
      '',
      '**Tarkistuksen rajat**',
      'Kutsukohdat on etsitty vain tarkistettujen määritelmien tiedostoista. Tämä ei ole koko projektin kattava käyttöhaku.',
    ].join('\n')
  }
  const verified = (Array.isArray(verifiedSources) ? verifiedSources : [])
    .filter(x => x && safeCodeName(x.symbol) && safePath(x.filePath))
    .slice(0, 8)
  const dependencies = (Array.isArray(dependencySources) ? dependencySources : [])
    .filter(x => x && safeCodeName(x.symbol) && safePath(x.filePath))
    .slice(0, 10)
  const lines = ['**Lähdekoodista vahvistetut tiedot**']
  for (const item of verified) lines.push(`- Funktion **${item.symbol}** määritelmä löytyy tiedostosta ${item.filePath}${item.truncated ? ' (osittainen katkelma)' : ''}.`)
  for (const item of dependencies) lines.push(`- Riippuvuuden **${item.symbol}** määritelmä löytyi tiedostosta ${item.filePath}${item.partial ? ' (osittainen katkelma)' : ''}.`)
  if (lines.length === 1) lines.push('Annettua kysymystä varten ei löytynyt riittävästi todennettuja lähdekooditietoja.')
  const missing = (Array.isArray(missingSymbols) ? missingSymbols : []).slice(0, 4)
  if (missing.length) lines.push('- Joitakin kysyttyjä symboleja ei voitu todentaa. Tämä ei osoita, ettei niitä olisi muualla projektissa.')
  lines.push('', '**Mikä jäi epävarmaksi**', 'AI:n omaa selitystä, toiminnallisia johtopäätöksiä tai mahdollisia muutosehdotuksia ei ole semanttisesti todistettu. Tiedostot voivat olla osittain luettuja. Tarkista ne erikseen ennen toteutusta.')
  return lines.join('\n')
}

export function classifyAnalysisTrust(result) {
  const evidence = (Array.isArray(result?.verifiedSources) ? result.verifiedSources : [])
  const calls = result?.callSiteVerification
  const callersVerified = calls?.status === 'VERIFIED_MATCHES' && calls.matches?.length > 0
  return {
    status: evidence.length || callersVerified ? 'SOURCE_FACTS_ONLY' : 'INSUFFICIENT_EVIDENCE',
    interpretationVerified: false,
    modelProseVerified: false,
    executionApproved: false,
    codeEditsAllowed: false,
    limitations: [
      'Lähdekoodin aitouden tarkistus ei todista AI:n johtopäätösten oikeellisuutta.',
      'Suunnitelmien toteutus edellyttää erillistä hyväksyntää ja testattua kirjoitustyökalua.',
    ],
  }
}
