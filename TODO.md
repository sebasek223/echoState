# TODO - Oprava přehrávání zvuků (soundToggle)

- [x] Upravit `apka/style.css`: odstranit duplicitní pravidla pro `#soundToggle`, zajistit viditelnost a klikatelnost a stabilní stav přes `.active`.
- [x] Upravit `apka/app.js`: sjednotit logiku toggle (1 zdroj pravdy), přidat `audioCtx.resume()` před startem po kliknutí a vždy volat `lucide.createIcons()` po změně ikony.
- [x] Ověřit: tlačítko je vždy viditelné a klikatelné, ikony se přepínají `volume-2`/`volume-x` a zvuk se spouští po prvním kliknutí.



