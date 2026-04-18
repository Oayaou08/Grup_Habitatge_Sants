# GHAS Web — Guia d'ús
## Com actualitzar la web (sense coneixements tècnics)

---

## CONFIGURACIÓ INICIAL (una sola vegada, ~10 minuts)

### Pas 1 — Crea el Google Sheet

1. Ves a **drive.google.com** i crea un full de càlcul nou
2. Anomena'l: `GHAS Web - Continguts`
3. Crea **dues pestanyes** (part inferior de la pantalla):
   - Una que es digui exactament: `news`
   - Una que es digui exactament: `events`

---

### Pas 2 — Estructura de la pestanya `news`

A la **primera fila** escriu exactament (en cel·les A1, B1, C1, D1):

| A       | B    | C    | D       |
|---------|------|------|---------|
| title   | date | type | content |

**Exemple de contingut (fila 2):**

| title                          | date       | type        | content                                      |
|--------------------------------|------------|-------------|----------------------------------------------|
| Acció contra desnonament Carrer Gran Via | 2024-06-15 | desnonament | Concentració de suport a la família Martínez |
| Assemblea mensual de juny      | 2024-06-01 | assemblea   | Debat sobre la nova llei d'habitatge          |

**Valors vàlids per a `type`:** desnonament · assemblea · comunicat · premsa · altre

---

### Pas 3 — Estructura de la pestanya `events`

A la **primera fila** escriu (en cel·les A1, B1, C1, D1):

| A     | B    | C        | D           |
|-------|------|----------|-------------|
| title | date | location | description |

**Exemple:**

| title                        | date       | location                   | description                            |
|------------------------------|------------|----------------------------|----------------------------------------|
| Concentració Carrer Gran Via | 2024-06-20 | Carrer Gran Via, 42, Sants | Donem suport a la família afectada      |
| Assemblea oberta GHAS        | 2024-07-05 | Centre Cívic Cotxeres      | Assemblea mensual, tothom benvingut     |

**Format de la data:** AAAA-MM-DD (exemple: 2024-06-20)

---

### Pas 4 — Publica el full com a JSON públic

1. Al Google Sheet, ves a **Fitxer → Compartir → Publicar al web**
2. Al desplegable de l'esquerra, tria: **Tot el document**
3. Al desplegable de la dreta, tria: **Valors separats per comes (.csv)**
   *(en realitat no importa, ho necessitem per activar la publicació)*
4. Fes clic a **Publicar**
5. Confirma amb **D'acord**

---

### Pas 5 — Obté l'ID del full

L'ID del full és el codi llarg que apareix a la URL:

```
https://docs.google.com/spreadsheets/d/  ← ID AQUÍ →  /edit
```

Exemple d'ID: `1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms`

---

### Pas 6 — Connecta l'ID a la web

1. Obre el fitxer `js/api.js` amb un editor de text
2. A la línia 10, substitueix `TU_SHEET_ID_AQUI` pel teu ID:

```javascript
SHEET_ID: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms',
```

3. Guarda el fitxer

**Ja està. La web ja llegirà les dades del teu full.**

---

## ÚS DIARI — Com afegir contingut (~2 minuts)

### Afegir un nou desnonament / acció:

1. Obre el Google Sheet
2. Ves a la pestanya `events`
3. Afegeix una nova fila al final amb:
   - **title:** Descripció breu (ex: "Concentració Carrer Badal 12")
   - **date:** Data en format AAAA-MM-DD (ex: "2024-07-15")
   - **location:** Lloc (ex: "Carrer Badal 12, Sants")
   - **description:** Descripció opcional
4. Guarda (Ctrl+S o es guarda automàticament)

**La web s'actualitzarà sola en 5 minuts.**

---

### Afegir una notícia:

1. Obre el Google Sheet
2. Ves a la pestanya `news`
3. Afegeix una nova fila al final
4. Guarda

**Ordre:** les notícies més recents apareixen primer automàticament.

---

## PREGUNTES FREQÜENTS

**P: Puc eliminar una fila?**
R: Sí, simplement elimina-la del Sheet. Desapareixerà de la web.

**P: Puc editar una fila ja publicada?**
R: Sí, edita-la al Sheet i es reflectirà a la web.

**P: Quan s'actualitza la web?**
R: Cada vegada que algú obre la web, i automàticament cada 10 minuts.
   Si vols forçar-ho, prem el botó "↺ Actualitzar" a la web.

**P: La web no carrega les dades. Que faig?**
R: Comprova que:
   1. El Sheet estigui publicat (Pas 4)
   2. L'ID sigui correcte al fitxer api.js (Pas 6)
   3. Les pestanyes es diguin exactament `news` i `events` (minúscules)

**P: Puc canviar els textos fixos de la web (claim, about, etc.)?**
R: Sí, editant directament el fitxer `index.html`.
   Busca el text que vols canviar i substitueix-lo.

---

## ESTRUCTURA DE FITXERS

```
ghas-web/
├── index.html          ← Estructura de la pàgina (textos fixos)
├── css/
│   └── style.css       ← Disseny visual (no cal tocar)
└── js/
    ├── api.js          ← Connexió amb Google Sheets (editar SHEET_ID)
    ├── render.js       ← Com es mostra el contingut (no cal tocar)
    └── main.js         ← Lògica de l'app (no cal tocar)
```

---

## COM PUBLICAR LA WEB (hosting gratuït)

**Opció A — GitHub Pages (recomanat):**
1. Crea un compte a github.com
2. Crea un repositori nou
3. Puja tots els fitxers
4. Ves a Settings → Pages → Branch: main
5. La web estarà disponible a: `username.github.io/nom-repo`

**Opció B — Netlify:**
1. Crea un compte a netlify.com
2. Arrossega la carpeta `ghas-web` a la pantalla principal
3. Obtens una URL immediata (es pot personalitzar)

**Opció C — Servidor propi:**
Simplement copia tots els fitxers a qualsevol servidor web.
No cal PHP, Node, ni cap backend. Són fitxers estàtics.

---

*GHAS Web — Codi obert, sense backend, sense base de dades.*
*Qualsevol persona pot actualitzar el contingut en menys de 2 minuts.*
