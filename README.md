# Disciples Map Quiz

Simple static webapp that asks students to click on a world map where each of the 12 disciples plus Mark and Paul ministered / served / died.

Files added:
- [index.html](index.html)
- [css/styles.css](css/styles.css)
- [js/app.js](js/app.js)
- [data/places.json](data/places.json)

How to use

1. Open `index.html` in a browser (or serve the folder with a static server). The layout adapts to phones and desktop screens.
2. The left panel shows the prompt; click the country where you think the person ministered/served/died. The whole country fills with color after you answer.
3. Use `Show All Answers` as a hint; it highlights possible answer countries without submitting the question.
4. After an answer, read the journey summary, use `Retry` to try the same question again, or click `Next` to continue. `Reveal Answer` also unlocks `Next`.
5. Edit the `country` and `countryCode` values in `data/places.json` to change the accepted answers. The ISO code is used internally; the interface displays full country names.

Notes

- Historical ministry and death locations can be uncertain. The supplied country choices are traditional examples intended for classroom editing.
- Country boundaries are loaded from the `datasets/geo-countries` GeoJSON repository. Country names appear only at close zoom levels when the full name fits inside the actual country shape.

Publish and QR code

This is a static site and can be published with GitHub Pages or Netlify. After publishing, use the public HTTPS URL as the QR-code destination. For example, a GitHub Pages URL usually looks like:

`https://YOUR-USERNAME.github.io/YOUR-REPOSITORY/`

Generate a printable QR code from that URL with any trusted QR-code generator, then test it from a phone on cellular data before sharing it with students. The QR code must point to the public URL, not `localhost`.
