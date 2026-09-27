# Il fait chaud

Carte personnelle des villes où l’été reste supportable **aujourd’hui** et en **2050**.

Auteur : **Gaspard Bébié-Valérian**  
Site : [gbv34.github.io/il-fait-chaud](https://gbv34.github.io/il-fait-chaud/)

## Licence

Ce dépôt n’est **pas** un logiciel libre. Il est publié sous une **licence propriétaire** (`LICENSE`, en anglais).

- Le code, l’interface, le classement et les traitements appartiennent à Gaspard Bébié-Valérian.
- Mettre le site en ligne ne donne **aucun droit** de copier, modifier, forker, redistribuer ou réutiliser le logiciel.
- Une autorisation écrite est obligatoire pour tout autre usage. Contact : gbebie-valerian@antidot.net
- Les **données** (Météo-France, DRIAS, CAMS, INSEE, etc.) restent aux licences de leurs producteurs.

Crédits aussi dans l’app (bouton **Crédits**).

## Partager une vue

Dans l’app, **Partager** envoie un lien (WhatsApp, mail, ou copie) qui rouvre la même configuration : lieu, horizon, lecture, dates Entrée / Sortie. Exemple : Ganges + séries ≥ 35 °C + une période.

## Lancer en local

```bash
npm install
npm run protect
cd docs && python3 -m http.server 8765
```

Puis http://127.0.0.1:8765/

Le source éditable est `src/app.js`. GitHub Pages ne sert que `docs/app.min.js` (obfusqué). Un site public reste techniquement téléchargeable ; la licence et l’obfuscation en interdisent la réutilisation, elles ne la rendent pas impossible.

`npm run sync` recopie le source sans l’obfusquer, pour tester plus vite.

## D’où viennent les métriques

Rien n’est inventé côté client : la carte lit des JSON dans `docs/data/`, produits en local à partir de sources ouvertes.

### Aujourd’hui (mesures)

| Indicateur | Source | Détail |
|---|---|---|
| Tx, Tn, jours ≥ 30 °C, nuits tropicales, séries chaudes | **Météo-France** | [Données climatologiques de base — quotidiennes](https://www.data.gouv.fr/datasets/donnees-climatologiques-de-base-quotidiennes) (BASE/QUOT RR-T-Vent). Un CSV gzip par département, Licence Ouverte 2.0. **Du 1er janvier jusqu’aux dernières mesures** ; le slider Entrée / Sortie choisit la fenêtre. |
| Air (PM2,5, NO₂, ozone) | **CAMS** via [Open-Meteo Air Quality](https://open-meteo.com/en/docs/air-quality-api) | Maille ~11 km, pas une station ATMO. Hiver 2025–26 et été 2026. |
| Aires d’attraction, population | **INSEE** + [geo.api.gouv.fr](https://geo.api.gouv.fr/) | AAV 2020 ; climat au pôle, pas à la couronne. |
| Hôpital, campus, musée, gare | FINESS, MESR, Musées de France, SNCF | Distances au pôle. |
| Feu, inondation, nucléaire, Cat Nat | [Géorisques](https://www.georisques.gouv.fr/) | Diagnostic présent, pas une projection 2050. |
| Restrictions d’eau | [VigiEau](https://api.vigieau.gouv.fr/) | Niveau en vigueur à la commune. |
| Microclimats (optionnel) | [Infoclimat opendata](https://www.infoclimat.fr/opendata/) | Clé obligatoire, 7 jours par requête. Pas le classement national. |

### 2050 (projections)

| Indicateur | Source | Détail |
|---|---|---|
| Max d’été, jours ≥ 30/35 °C, nuits tropicales, IFM, sols secs | **DRIAS** TRACC-2023 / Explore2 ADAMONT | Médiane multimodèle (ENSq50), jalon **+2,7 °C**, maille 8 km. Redistrib. [Hugging Face](https://huggingface.co/datasets/saadtaleb/france-climate-risk-drias-tracc-2023), Licence Ouverte 2.0. Cumuls climatiques, pas le pic ni la longueur d’une canicule. |
| Même famille d’indicateurs hors de France | **CMIP6** via [Open-Meteo Climate](https://open-meteo.com/en/docs/climate-api) | Modèle MRI_AGCM3_2_S, étés 2046–2050, maille ~20 km (DE, CH, ES, IT). Comparable entre voisins, pas au degré près avec DRIAS. |

Le fond de carte est [OpenStreetMap](https://www.openstreetmap.org/copyright).

## Relancer les mesures 2026

Les fichiers Météo-France `latest-2025-2026` avancent tout seuls côté producteur. En local, un cache disque évite de tout retélécharger : il faut `--refresh` pour ramener les jours récents, puis réexporter le JSON de la carte. La fenêtre va du **1er janvier** à **aujourd’hui**.

```bash
python3 -m pip install -r requirements.txt
python3 scripts/fetch_and_rank_jja.py --refresh
python3 scripts/export_web_daily.py
```
