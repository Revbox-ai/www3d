# 3D Scroll House MVP dla developera

To jest prosty prototyp strony WWW, w której użytkownik scrolluje stronę, a kamera 3D:

1. pokazuje inwestycję z daleka,
2. zbliża się do budynku,
3. wchodzi przez drzwi,
4. przechodzi kolejno przez salon, kuchnię, hall i strefę prywatną.

Model jest celowo uproszczony: biała makieta 3D bez tekstur, zbudowana z podstawowych brył. Dzięki temu projekt można łatwo potraktować jako MVP i później podmienić bryły na właściwy model GLB/GLTF od architekta lub z Blendera.

## Jak uruchomić

Najprościej uruchomić lokalny serwer w katalogu projektu:

```bash
python -m http.server 8080
```

Potem otwórz w przeglądarce:

```text
http://localhost:8080
```

Projekt używa Three.js z CDN, więc podczas uruchamiania potrzebny jest dostęp do internetu.

## Struktura plików

```text
index.html
src/styles.css
src/app.js
assets/project-notes.md
```

## Gdzie edytować trasę kamery

W pliku `src/app.js` znajdziesz tablicę:

```js
const cameraKeyframes = [...]
```

Każdy punkt ma:

- `p` - pozycję na scrollu od 0 do 1,
- `pos` - pozycję kamery,
- `target` - punkt, na który kamera patrzy,
- `stage` - etap tekstowy w interfejsie.

## Gdzie edytować teksty

W pliku `src/app.js` znajdziesz tablicę:

```js
const stageContent = [...]
```

Tam można zmienić tytuły i opisy widoczne podczas spaceru.

## Jak rozwinąć MVP

Najbliższe kroki produkcyjne:

- podmiana prostych brył na model GLB/GLTF,
- dodanie tekstur PBR i realistycznego światła,
- dodanie hotspotów w pokojach,
- dodanie rzutu kondygnacji jako mini mapy,
- integracja z WordPressem lub Webflow,
- dodanie formularza kontaktowego i danych inwestycji.
