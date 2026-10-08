// Det här är filen du redigerar för att göra sajten till din egen.

export const SITE = {
  name: 'Podkoder',
  /** Den publika adressen. Används för sitemap, canonical-länkar och delningsbilder. */
  url: 'https://podkoder.se',
  /** GitHub-repot. Används för "Rapportera"- och "Tipsa om kod"-länkar. */
  repo: 'https://github.com/TonalLobster/podkoder',

  /** Hur länge en kod räknas som färsk, och när den döljs helt. */
  freshness: {
    verifiedDays: 60,
    hideAfterDays: 150,
  },

  /**
   * Donationer. Lämna ett fält tomt för att dölja det alternativet.
   * Är alla tomma döljs donationsrutorna (i dev-läge visas en påminnelse i stället).
   */
  donate: {
    /** Ditt Swish-nummer, t.ex. '0701234567' eller ett 123-nummer. Ger en QR-kod på /stod. */
    swish: '',
    /** Förslag på belopp i Swish-QR:n (går att ändra i appen). */
    swishAmount: 30,
    swishMessage: 'Kaffe till Podkoder',
    /** t.ex. 'https://ko-fi.com/dittnamn' */
    kofi: '',
    /** t.ex. 'https://buymeacoffee.com/dittnamn' */
    buymeacoffee: '',
    /** t.ex. 'https://github.com/sponsors/dittnamn' */
    githubSponsors: '',
  },

  /** Kontakt för poddare som vill lägga till, ändra eller ta bort koder. */
  contactEmail: '',
};

export function hasDonations(): boolean {
  const d = SITE.donate;
  return Boolean(d.swish || d.kofi || d.buymeacoffee || d.githubSponsors);
}
