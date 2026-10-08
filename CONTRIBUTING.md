# Bidra till Podkoder

Tack för att du vill hjälpa till! Det enklaste sättet är att [tipsa om en kod via formuläret](../../issues/new?template=ny-kod.yml). Den här guiden är för dig som vill lägga in koder direkt med en pull request.

## Regler för koder

- Koden ska ha **nämnts offentligt** i en podd, i avsnittet eller i shownotes.
- Varje kod måste ha en **källa**: en länk till avsnittet eller sidan där den nämns.
- `last_verified` är datumet då koden **senast nämndes** (oftast avsnittets publiceringsdatum), inte dagens datum.
- Inga personliga koder, till exempel värva-en-vän-koder.
- Skriv `discount` med egna ord och kopiera inte annonstexten.
- **Vi listar inte spel, receptbelagda läkemedel, alkohol, nikotin eller cannabis.** Sajten drivs från Sverige, där det är förbjudet att marknadsföra olicensierat spel och receptbelagda läkemedel mot konsumenter. Alkohol och nikotin har också hårda regler. Skannern filtrerar bort det mesta automatiskt (`BLOCKED_RE` i `scripts/rss-scan.ts`).

## Marknad: var gäller koden?

Fältet `market` styr på vilken språkversion koden visas:

| `market` | Betyder | Visas på |
| --- | --- | --- |
| `SE` | Gäller i Sverige | svenska sajten |
| `US` / `UK` | Gäller bara i USA/Storbritannien (fysiska varor, lokala tjänster) | engelska sajten |
| `INT` | Fungerar oavsett land (VPN, appar, digitala tjänster) | båda |

Är du osäker väljer du landet där podden finns. Det är bättre att en kod saknas på svenska sajten än att den inte fungerar för den som försöker.

## Lägg till en kod

Skapa en fil i `data/codes/` som heter `<podd>--<varumärke>.yaml`:

```yaml
podcast: fotbollsmorgon          # filnamnet i data/podcasts/ (utan .yaml)
brand: recipe-for-men            # filnamnet i data/brands/ (utan .yaml)
code: FOTBOLLSMORGON             # utelämna om erbjudandet bara går via länk
discount: 25 % på hela sortimentet
url: https://recipeformen.se/discount/FOTBOLLSMORGON   # valfri om `code` finns
valid_until: 2026-12-31          # valfri
last_verified: 2026-09-24
source: https://shows.acast.com/fotbollsmorgon/episodes/...
note: Kan inte kombineras med andra erbjudanden.        # valfri
market: SE                       # SE om inget annat anges
```

Har podden flera koder för samma varumärke lägger du till `-2`, `-3` och så vidare i filnamnet.

Pekar `source` inte på ett enskilt avsnitt (många amerikanska flöden länkar bara till poddens webbplats) anger du avsnittets titel i `episode`.

En kod som visas på båda språken (`market: INT`) kan ha översatt text:

```yaml
discount:
  sv: 10 % på din första beställning
  en: 10% off your first order
```

Samma sak gäller `note`. Finns bara ett språk visas det på båda sajterna.

## Lägg till en podd

`data/podcasts/<id>.yaml`. Id:t är poddens namn med små bokstäver, utan å/ä/ö och med bindestreck:

```yaml
name: Fotbollsmorgon
by: DobbTV                       # värdar eller nätverk, valfritt
website: https://shows.acast.com/fotbollsmorgon
rss: https://feeds.acast.com/public/shows/...           # gör att den nattliga skanningen hittar nya koder
apple: https://podcasts.apple.com/se/podcast/...
language: sv                     # sv eller en
```

Hittar du inte RSS-flödet? Kör `npm run discover -- --search="poddens namn"` och titta i `scripts/.cache/discovered.json`.

## Lägg till ett varumärke

`data/brands/<id>.yaml`:

```yaml
name: Recipe for men
website: https://recipeformen.se
category: skonhet
aliases: ['Recipe for Men AB']   # valfritt, hjälper skannern att känna igen varumärket
```

Kategorierna finns i [`src/lib/categories.ts`](src/lib/categories.ts): `mat`, `halsa`, `mode`, `skonhet`, `hem`, `teknik`, `ekonomi`, `foretag`, `somn`, `media`, `resor`, `barn`, `djur` och `ovrigt`.

## Testa lokalt

```bash
npm install
npm run dev     # http://localhost:4321
npm run build   # validerar all data mot schemat
```

Bygget stoppar med ett tydligt fel om en fil saknar fält eller pekar på en podd eller ett varumärke som inte finns.

## För dig som underhåller sajten

Varje natt kör GitHub Actions `npm run scan`, som läser RSS-flödena för alla poddar i `data/podcasts/`. Resultatet blir en pull request med:

- **nya förslag** i `candidates/`
- **nytt `last_verified`** för koder som nämnts i ett nyare avsnitt

Merga pull requesten och gå sedan igenom förslagen lokalt:

```bash
git pull
npm run review
```

Granskningen visar varje förslag med sammanhang och källa:

- **j** lägger till koden och skapar podd och varumärke om de saknas.
- **n** avvisar förslaget. Det sparas i `candidates/rejected.txt` och föreslås inte igen.
- **h** hoppar över förslaget.

Committa och pusha resultatet när du är klar.

## Licens

Genom att bidra godkänner du att kod licensieras under [MIT](LICENSE) och data i `data/` under [CC BY-SA 4.0](LICENSE-DATA.md).
