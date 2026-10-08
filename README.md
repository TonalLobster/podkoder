# Podkoder

Öppen, community-driven samling av rabattkoder från svenska och engelska poddar. Varje kod har en källa (avsnittet där den nämns) och ett datum. Inga affiliate-länkar, finansieras med frivilliga bidrag.

- Statisk sajt byggd med [Astro](https://astro.build), all data som YAML i `data/`
- Nattlig RSS-skanning som hittar nya koder och håller befintliga färska
- Öppen data: `/koder.json`

## Kom igång

```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # statisk sajt i dist/, validerar all data
```

Kräver Node 22.18 eller senare, eftersom skripten i `scripts/` körs som TypeScript direkt med Node.

## Struktur

```
data/
  podcasts/<id>.yaml              poddar
  brands/<id>.yaml                varumärken
  codes/<podd>--<varumärke>.yaml  erbjudanden
candidates/                       förslag från RSS-skanningen, väntar på granskning
scripts/                          discover, rss-scan, review
src/
  site.config.ts                  ← namn, domän, repo och donationer
  content.config.ts               schemat för data/
  i18n/                           svenska och engelska texter
  views/                          sidmallar (delas mellan språk)
  pages/                          routes (svenska i roten)
```

Hur man lägger till koder, poddar och varumärken står i [CONTRIBUTING.md](CONTRIBUTING.md).

## Hitta och granska koder

```bash
npm run discover -- --search="humor,hälsa"           # hitta svenska poddar via Apple
npm run scan -- --source=discovered --lang=sv --dry  # testa vad deras RSS-flöden innehåller
npm run scan                                          # skanna poddarna i data/, förslag hamnar i candidates/
npm run review                                        # gå igenom förslagen ett i taget
```

Skannern hittar tre typer av erbjudanden i shownotes:

- **koder**: ”använd koden PODD20”
- **Shopify-rabattlänkar**: `butik.se/discount/KOD`
- **personliga länkar**: `nordvpn.com/poddnamn`

De flesta svenska poddar läser bara upp koderna i ljudet. Därför är tips från lyssnare minst lika viktiga.

## Publicera

1. **GitHub:** skapa ett publikt repo och pusha. Ändra `repo` i `src/site.config.ts` till repots adress, så att "Tipsa om kod" och "Funkar inte?" går till rätt formulär.
2. **Actions:** slå på *Settings → Actions → General → Allow GitHub Actions to create and approve pull requests*, så att den nattliga skanningen kan öppna pull requests.
3. **Cloudflare Pages:** koppla repot. Byggkommando `npm run build`, utdatamapp `dist`, miljövariabel `NODE_VERSION=24`.
4. **Domän:** koppla din domän i Cloudflare och ändra `url` i `src/site.config.ts`.
5. **Nattligt bygge:** skapa en deploy hook i Cloudflare Pages (*Settings → Builds → Deploy hooks*) och spara URL:en som repo-hemligheten `CF_DEPLOY_HOOK`. Det behövs för att statusen ”färsk/kan ha gått ut” räknas om varje dag.
6. **Donationer:** fyll i Swish-nummer, Ko-fi och liknande i `src/site.config.ts`. Tomma fält döljs.

## GitHub Actions

| Workflow | När | Vad |
| --- | --- | --- |
| `ci.yml` | Varje pull request och push till main | Typkontroll och bygge, som stoppar trasig data |
| `scan.yml` | Varje natt 03:17 UTC | Skannar RSS och öppnar en pull request med förslag och återverifierade koder |
| `rebuild.yml` | Varje natt 04:00 UTC | Triggar ett nytt bygge i Cloudflare Pages |

## Två språk, flera marknader

Sajten finns på svenska (`/`) och engelska (`/en`). Båda använder samma vyer i `src/views/`, och texterna finns i `src/i18n/`.

Varje kod har en `market` som styr var den visas (`MARKETS` i `src/lib/offers.ts`):

- **Svenska sajten** visar `SE` och `INT`. Det blir svenska poddar plus de koder från engelska poddar som fungerar i Sverige (VPN, appar och liknande), märkta ”Gäller internationellt”.
- **Engelska sajten** visar `US`, `UK` och `INT`, märkta ”US only”, ”UK only” och ”Worldwide”.

Hitta fler engelska poddar:

```bash
npm run discover -- --country=us     # eller gb
npm run scan -- --source=discovered --lang=en --dry
```

## Vad vi inte listar

Spel, receptbelagda läkemedel, alkohol, nikotin och cannabis. Sajten drivs från Sverige, där det är förbjudet att marknadsföra olicensierat spel och receptbelagt mot konsumenter. Skannern filtrerar bort sådana erbjudanden automatiskt (`BLOCKED_RE` i `scripts/rss-scan.ts`).

## Licens

Kod: [MIT](LICENSE). Data i `data/`: [CC BY-SA 4.0](LICENSE-DATA.md).
