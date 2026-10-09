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
    let countryLabels = [];
    const name = country => country.properties.name;
    const available = country => musicCountries.has(name(country));
    const matches = (country, other) => other && name(country) === name(other);
    const capColor = country => {
        if (matches(country, selected)) return matches(country, hovered) ? 'rgba(255,223,160,0.9)' : 'rgba(241,207,139,0.75)';
        if (matches(country, hovered)) return available(country) ? 'rgba(100,216,207,0.8)' : 'rgba(135,190,202,0.48)';
        return available(country) ? 'rgba(100,216,207,0.48)' : 'rgba(10,30,40,0.12)';
    };
    function hoverCountry(country) {
        hovered = country;
        globe.polygonCapColor(capColor);
        container.style.cursor = country && available(country) ? 'pointer' : 'grab';
    }

    // Find a visual center inside the largest landmass, away from borders and holes.
    // A whole-country centroid can fall offshore for islands or concave countries.
    function labelPlacement(country) {
        const polygons = country.geometry.type === 'MultiPolygon' ? country.geometry.coordinates : [country.geometry.coordinates];
        const coordinates = polygons.reduce((largest, polygon) =>
            d3.geoArea({type: 'Polygon', coordinates: polygon}) > d3.geoArea({type: 'Polygon', coordinates: largest}) ? polygon : largest);
        const landmass = {type: 'Polygon', coordinates};
        const centroid = d3.geoCentroid(landmass);
        const projection = d3.geoAzimuthalEqualArea().rotate([-centroid[0], -centroid[1]]).scale(180 / Math.PI).translate([0, 0]);
        const rings = coordinates.map(ring => ring.map(projection));
        const outer = rings[0];
        let minX = d3.min(outer, point => point[0]), maxX = d3.max(outer, point => point[0]);
        let minY = d3.min(outer, point => point[1]), maxY = d3.max(outer, point => point[1]);
        function clearance(point) {
            if (!d3.polygonContains(outer, point) || rings.slice(1).some(ring => d3.polygonContains(ring, point))) return -1;
            let distance = Infinity;
            for (const ring of rings) {
                for (let i = 1; i < ring.length; i++) {
                    const a = ring[i - 1], b = ring[i];
                    const dx = b[0] - a[0], dy = b[1] - a[1];
                    const t = Math.max(0, Math.min(1, ((point[0] - a[0]) * dx + (point[1] - a[1]) * dy) / (dx * dx + dy * dy || 1)));
                    distance = Math.min(distance, Math.hypot(point[0] - a[0] - t * dx, point[1] - a[1] - t * dy));
                }
            }
            return distance;
        }
        let best = projection(centroid), bestDistance = clearance(best);
        for (let pass = 0; pass < 5; pass++) {
            const stepX = (maxX - minX) / 10, stepY = (maxY - minY) / 10;
            for (let x = 0; x <= 10; x++) for (let y = 0; y <= 10; y++) {
                const point = [minX + x * stepX, minY + y * stepY];
                const distance = clearance(point);
                if (distance > bestDistance) { best = point; bestDistance = distance; }
            }
            minX = best[0] - stepX; maxX = best[0] + stepX;
            minY = best[1] - stepY; maxY = best[1] + stepY;
        }
        const center = projection.invert(best);
        // Cap type size and shrink longer names in compact countries.
        const size = Math.max(0.2, Math.min(available(country) ? 0.65 : 0.55, bestDistance * 2 / Math.max(1, name(country).length * 0.55)));
        return {center: d3.geoContains(landmass, center) ? center : centroid, size};
    }
    async function selectCountry(country) {
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
                const response = await fetch(`${base}api/mp3?country=${encodeURIComponent(name(country))}`);
                if (!response.ok) throw new Error('Recording unavailable');
                const data = await response.json();
                if (version !== selectionVersion) return;
                audioPlayer.src = data.mp3_link;
                status.textContent = 'Use the timeline to explore the recording.';
                audioPlayer.play().catch(() => { if (version === selectionVersion) status.textContent = 'Press play to start listening.'; });
            } catch { if (version === selectionVersion) status.textContent = 'This recording could not load. Please try again.'; }
    }
    const globe = Globe()(container)
        .backgroundColor('#071421')
        .globeImageUrl('https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg')
        .polygonCapColor(capColor)
        .polygonSideColor(() => 'rgba(100,216,207,0.12)')
        .polygonStrokeColor(country => (selected && name(country) === name(selected)) ? '#f1cf8b' : available(country) ? '#64d8cf' : 'rgba(200,220,230,0.16)')
        .polygonAltitude(country => (selected && name(country) === name(selected)) ? 0.018 : available(country) ? 0.008 : 0.001)
        .labelText(country => country.properties.name)
        .labelLat(country => country.center[1])
        .labelLng(country => country.center[0])
        .labelAltitude(0.025)
        .labelSize(country => country.labelSize)
        .labelDotRadius(0)
        .labelColor(country => available(country) ? '#bafff6' : '#d8e5ed')
        .labelsTransitionDuration(0)
        .polygonLabel(country => `${name(country)} · ${available(country) ? 'Music available' : 'No recording yet'}`)
        .onPolygonHover(hoverCountry)
        .onLabelHover(hoverCountry)
        .onPolygonClick(selectCountry)
        .onLabelClick(selectCountry);

    document.getElementById('country-names').addEventListener('change', event => globe.labelsData(event.target.checked ? countryLabels : []));
    new ResizeObserver(() => globe.width(container.clientWidth).height(container.clientHeight)).observe(container);
    try {
        const [catalogResponse, worldResponse] = await Promise.all([
            fetch(`${base}api/countries_with_mp3`),
            fetch('https://unpkg.com/world-atlas@2/countries-110m.json')
        ]);
        if (!catalogResponse.ok || !worldResponse.ok) throw new Error('Map unavailable');
        const [catalog, world] = await Promise.all([catalogResponse.json(), worldResponse.json()]);
        catalog.forEach(country => musicCountries.add(country));
        const countries = topojson.feature(world, world.objects.countries).features;
        countryLabels = countries.map(country => {
            const placement = labelPlacement(country);
            return {...country, center: placement.center, labelSize: placement.size};
        });
        globe.polygonsData(countries);
        if (document.getElementById('country-names').checked) globe.labelsData(countryLabels);
        status.textContent = `${musicCountries.size} countries with music. Select a teal country to listen.`;
    } catch { status.textContent = 'The music map could not load. Please refresh to try again.'; }
});
