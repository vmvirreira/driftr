document.addEventListener('DOMContentLoaded', async () => {
    const audioPlayer = document.getElementById('audio-player');
    const selectedCountryText = document.getElementById('selected-country-text');
    const status = document.getElementById('listening-status');
    const container = document.getElementById('globe-container');
    const base = window.DRIFTR_BASE_URL || '/';
    const musicCountries = new Set();
    let selected = null;
    let hovered = null;
    let selectionVersion = 0;
    const name = country => country.properties.name;
    const available = country => musicCountries.has(name(country));
    const capColor = country => country === selected ? 'rgba(241,207,139,0.75)' : available(country) ? (country === hovered ? 'rgba(100,216,207,0.8)' : 'rgba(100,216,207,0.48)') : 'rgba(10,30,40,0.12)';
    const globe = Globe()(container)
        .backgroundColor('#071421')
        .globeImageUrl('https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg')
        .polygonCapColor(capColor)
        .polygonSideColor(() => 'rgba(100,216,207,0.12)')
        .polygonStrokeColor(country => country === selected ? '#f1cf8b' : available(country) ? '#64d8cf' : 'rgba(200,220,230,0.16)')
        .polygonAltitude(country => country === selected ? 0.018 : available(country) ? 0.008 : 0.001)
        .polygonLabel(country => `${name(country)} · ${available(country) ? 'Music available' : 'No recording yet'}`)
        .onPolygonHover(country => { hovered = country; globe.polygonCapColor(capColor); container.style.cursor = country && available(country) ? 'pointer' : 'grab'; })
        .onPolygonClick(async country => {
            if (!available(country)) { status.textContent = `No recording for ${name(country)} yet. Try a teal country.`; return; }
            selected = country;
            const version = ++selectionVersion;
            globe.polygonCapColor(capColor).polygonStrokeColor(globe.polygonStrokeColor()).polygonAltitude(globe.polygonAltitude());
            selectedCountryText.textContent = name(country);
            status.textContent = 'Loading recording…';
            audioPlayer.pause();
            audioPlayer.removeAttribute('src');
            audioPlayer.load();
            try {
                const response = await fetch(`${base}api/mp3/${encodeURIComponent(name(country))}`);
                if (!response.ok) throw new Error('Recording unavailable');
                const data = await response.json();
                if (version !== selectionVersion) return;
                audioPlayer.src = data.mp3_link;
                status.textContent = 'Use the timeline to explore the recording.';
                audioPlayer.play().catch(() => { if (version === selectionVersion) status.textContent = 'Press play to start listening.'; });
            } catch { if (version === selectionVersion) status.textContent = 'This recording could not load. Please try again.'; }
        });
    new ResizeObserver(() => globe.width(container.clientWidth).height(container.clientHeight)).observe(container);
    try {
        const [catalogResponse, worldResponse] = await Promise.all([
            fetch(`${base}api/countries_with_mp3`),
            fetch('https://unpkg.com/world-atlas@2/countries-110m.json')
        ]);
        if (!catalogResponse.ok || !worldResponse.ok) throw new Error('Map unavailable');
        const [catalog, world] = await Promise.all([catalogResponse.json(), worldResponse.json()]);
        catalog.forEach(country => musicCountries.add(country));
        globe.polygonsData(topojson.feature(world, world.objects.countries).features);
        status.textContent = `${musicCountries.size} countries with music. Select a teal country to listen.`;
    } catch { status.textContent = 'The music map could not load. Please refresh to try again.'; }
});
