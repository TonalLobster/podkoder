export const sv = {
  locale: 'sv-SE',
  meta: {
    title: 'Podkoder: rabattkoder från poddarna du lyssnar på',
    description:
      'Sök bland rabattkoder och erbjudanden från svenska och engelska poddar. Öppen källkod och driven av lyssnare. Varje kod har en källa och ett datum.',
  },
  nav: {
    podcasts: 'Poddar',
    brands: 'Varumärken',
    contribute: 'Tipsa om kod',
    about: 'Om',
    support: 'Bjud på kaffe',
    skip: 'Hoppa till innehållet',
    switchLang: 'English',
    switchLangLabel: 'Visa sajten på engelska',
  },
  /** Filnamn för GitHub-formulären i .github/ISSUE_TEMPLATE/. */
  templates: {
    newCode: 'ny-kod.yml',
    report: 'utgangen-kod.yml',
    podcaster: 'poddare.yml',
  },
  home: {
    title: 'Alla rabattkoder från dina poddar.',
    titleAccent: 'På ett ställe.',
    lead: 'Koderna som läses upp i svenska och engelska poddar, samlade och sökbara. Öppen källkod och driven av lyssnare. Varje kod har en källa och ett datum.',
    searchLabel: 'Sök varumärke, podd eller kod',
    searchPlaceholder: 'Sök varumärke, podd eller kod',
    stats: (offers: number, podcasts: number, brands: number) =>
      `${offers} erbjudanden · ${podcasts} poddar · ${brands} varumärken`,
    latest: 'Senaste erbjudandena',
    categories: 'Kategorier',
    showing: (n: number) => (n === 1 ? '1 erbjudande' : `${n} erbjudanden`),
    noResults: 'Ingen träff på',
    noResultsCta: 'Saknas koden? Tipsa oss',
  },
  offer: {
    copy: 'Kopiera',
    copied: 'Kopierad',
    copyLabel: (code: string) => `Kopiera koden ${code}`,
    linkOnly: 'Ingen kod behövs. Rabatten följer med länken.',
    openOffer: 'Öppna erbjudandet',
    toStore: 'Till butiken',
    via: 'via',
    seen: (date: string) => `Sedd ${date}`,
    aging: (date: string) => `Senast sedd ${date}, kan ha gått ut`,
    validUntil: (date: string) => `Gäller t.o.m. ${date}`,
    source: 'Källa',
    episode: (title: string) => `Avsnitt: ${title}`,
    report: 'Funkar inte?',
    marketTitle: 'Var erbjudandet gäller',
    market: {
      SE: 'Sverige',
      NO: 'Norge',
      DK: 'Danmark',
      FI: 'Finland',
      US: 'Bara USA',
      UK: 'Bara Storbritannien',
      INT: 'Gäller internationellt',
    },
    reportTitle: (brand: string, podcast: string) => `Funkar inte: ${brand} (${podcast})`,
  },
  podcast: {
    eyebrow: 'Podd',
    title: (name: string) => `${name}: rabattkoder och erbjudanden`,
    description: (name: string) => `Alla rabattkoder och erbjudanden från ${name}, samlade på ett ställe.`,
    count: (n: number) => (n === 1 ? '1 aktivt erbjudande' : `${n} aktiva erbjudanden`),
    empty: 'Inga aktiva koder just nu.',
    tip: (name: string) => `Har du hört en kod i ${name} som saknas här?`,
    links: { apple: 'Apple Podcasts', website: 'Webbplats', rss: 'RSS' },
  },
  podcasts: {
    title: 'Poddar',
    description: 'Alla poddar med rabattkoder och erbjudanden på Podkoder.',
    lead: 'Alla poddar vi har hittat rabattkoder från.',
  },
  brand: {
    eyebrow: 'Varumärke',
    title: (name: string) => `${name} rabattkod från poddar`,
    h1: (name: string) => `${name} rabattkod`,
    description: (name: string, n: number) =>
      `${n === 1 ? '1 rabattkod' : `${n} rabattkoder`} för ${name} från poddar. Med källa och datum för varje kod.`,
    lead: (offers: number, podcasts: number) =>
      `${offers === 1 ? '1 erbjudande' : `${offers} erbjudanden`} från ${podcasts === 1 ? '1 podd' : `${podcasts} poddar`}.`,
    fairTip: 'Välj gärna koden från en podd du gillar. Poddarna får ofta betalt när just deras kod används.',
    visit: (name: string) => `Till ${name}`,
    empty: 'Inga aktiva koder just nu.',
  },
  brands: {
    title: 'Varumärken',
    description: 'Alla varumärken med rabattkoder i poddar, från A till Ö.',
    lead: 'Alla varumärken med rabattkoder i poddar.',
  },
  category: {
    eyebrow: 'Kategori',
    title: (label: string) => `Rabattkoder från poddar: ${label}`,
    description: (label: string) => `Rabattkoder och erbjudanden från poddar inom ${label.toLowerCase()}.`,
    lead: (n: number) => (n === 1 ? '1 erbjudande.' : `${n} erbjudanden.`),
  },
  contribute: {
    title: 'Tipsa om en kod',
    description: 'Hört en rabattkod i en podd? Så lägger du till den på Podkoder.',
    lead: 'Podkoder byggs av lyssnare. Har du hört en kod i en podd tar det en minut att lägga till den.',
    formTitle: 'Fyll i formuläret',
    formText: 'Enklast. Du behöver ett gratis GitHub-konto. Vi granskar tipset och lägger in koden.',
    formButton: 'Öppna formuläret',
    prTitle: 'Skicka en pull request',
    prText: 'För dig som kan Git. Varje kod är en liten YAML-fil i data/codes/.',
    prLink: 'Läs CONTRIBUTING.md',
    example: `# data/codes/fotbollsmorgon--recipe-for-men.yaml
podcast: fotbollsmorgon        # filnamn i data/podcasts/
brand: recipe-for-men          # filnamn i data/brands/
code: FOTBOLLSMORGON
discount: 25 % på hela sortimentet
url: https://recipeformen.se/discount/FOTBOLLSMORGON
last_verified: 2026-09-24      # när koden nämndes
source: https://shows.acast.com/fotbollsmorgon/episodes/...
market: SE                     # SE, US, UK eller INT`,
    rulesTitle: 'Det här gäller',
    rules: [
      'Koden ska ha nämnts offentligt i en podd, i avsnittet eller i shownotes.',
      'Länka till avsnittet där koden nämns, och skriv ungefär när.',
      'Inga personliga koder, till exempel värva-en-vän-koder.',
      'Funkar en kod inte längre? Klicka på ”Funkar inte?” vid koden.',
    ],
    podcasterTitle: 'Är du poddare?',
    podcasterText:
      'Vill du att dina koder ska finnas med, vara rätt eller tas bort? Skapa ett ärende på GitHub, så fixar vi det.',
    podcasterButton: 'Kontakta oss',
  },
  about: {
    title: 'Om Podkoder',
    description: 'Vad Podkoder är, hur koderna samlas in och varför sajten är öppen källkod.',
    sections: {
      what: {
        title: 'Vad är det här?',
        body: 'Många poddar finansieras av sponsorer som ger lyssnarna en rabattkod. Koderna läses upp i avsnittet, försvinner i flödet och är svåra att hitta igen. Podkoder samlar dem på ett ställe.',
      },
      how: {
        title: 'Hur koderna hamnar här',
        steps: [
          'Varje natt läser ett skript poddarnas RSS-flöden och letar efter koder i avsnittsbeskrivningarna.',
          'Lyssnare tipsar om koder som bara sägs i ljudet.',
          'En människa granskar varje kod innan den publiceras. Koden får en källa (avsnittet) och ett datum.',
        ],
      },
      freshness: {
        title: 'Hur färska är koderna?',
        body: (fresh: number, hide: number) =>
          `En kod som setts i ett avsnitt de senaste ${fresh} dagarna räknas som aktuell. Äldre koder får en varning, och efter ${hide} dagar döljs de. När en podd nämner samma kod i ett nytt avsnitt uppdateras datumet automatiskt.`,
      },
      fair: {
        title: 'Poddarna tjänar på det',
        body: 'Många poddar får betalt för varje gång deras kod används. Därför visar vi alltid vilken podd koden kommer från och länkar till den. Gillar du en podd, använd deras kod.',
      },
      noAffiliate: {
        title: 'Inga affiliate-länkar',
        body: 'Podkoder tar inte betalt av varumärken och lägger inte in egna spårningslänkar. Länkarna går dit poddarna själva skickar dig. Sajten drivs med frivilliga bidrag.',
      },
      open: {
        title: 'Öppen källkod och öppen data',
        body: 'Koden är MIT-licensierad och datan är CC BY-SA 4.0. Använd den gärna, men ange källan.',
        repo: 'Källkoden på GitHub',
        json: 'All data som JSON',
      },
    },
  },
  support: {
    title: 'Bjud på en kaffe',
    description: 'Podkoder är gratis och reklamfritt. Stöd projektet med en kaffe.',
    lead: 'Podkoder är gratis, reklamfritt och har inga affiliate-länkar. Driften kostar nästan ingenting, men det tar tid att granska koder. Ett bidrag gör det lättare att fortsätta.',
    swishTitle: 'Swisha',
    swishText: 'Skanna QR-koden med Swish-appen, eller swisha till numret.',
    swishNumber: 'Nummer',
    otherTitle: 'Andra sätt',
    kofi: 'Ko-fi',
    buymeacoffee: 'Buy Me a Coffee',
    githubSponsors: 'GitHub Sponsors',
    whereTitle: 'Vart går pengarna?',
    where: [
      'Domän och drift.',
      'Tid att granska tips och verifiera koder.',
      'Nya funktioner, till exempel att transkribera avsnitt och hitta koder som bara sägs i ljudet.',
    ],
    notConfigured:
      'Inga donationsalternativ är inställda ännu. Fyll i dem i src/site.config.ts. Den här rutan syns bara under utveckling.',
  },
  donateBox: {
    title: 'Gillar du Podkoder?',
    text: 'Sajten är gratis, reklamfri och utan affiliate-länkar. Bjud gärna på en kaffe så kan vi fortsätta.',
    button: 'Stöd projektet',
  },
  footer: {
    tagline: 'Rabattkoder från poddar, samlade av lyssnare.',
    disclaimer: 'Podkoder är inte kopplat till någon podd eller något varumärke. Koderna kan ha gått ut, så kolla villkoren hos butiken.',
    license: 'Kod: MIT · Data: CC BY-SA 4.0',
    github: 'GitHub',
    data: 'Data (JSON)',
  },
  notFound: {
    title: 'Sidan finns inte',
    text: 'Koden kanske har gått ut, eller så har länken ändrats.',
    home: 'Till startsidan',
  },
};
