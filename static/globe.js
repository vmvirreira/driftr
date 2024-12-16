document.addEventListener('DOMContentLoaded', () => {
    const audioPlayer = document.getElementById('audio-player');

    // Initialize the globe
    const globe = Globe()(document.getElementById('globe-container'))
        .globeImageUrl('//unpkg.com/three-globe/example/img/earth-blue-marble.jpg')
        .polygonCapColor(() => 'rgba(0, 0, 0, 0)')  // Color for the country polygons
        .polygonLabel(({ properties: d }) => `${d.name || 'Unknown Country'}`)  // Label for country names
        .onPolygonClick((country) => {
            const countryName = country.properties.name || 'Unknown Country';
            console.log('Clicked country:', countryName);  // Log the clicked country name
            
            // Fetch the MP3 link from the backend
            fetch(`/api/mp3/${countryName}`)
                .then(response => response.json())
                .then(data => {
                    if (data.mp3_link) {
                        console.log("Playing MP3:", data.mp3_link);
                        audioPlayer.src = data.mp3_link;
                        audioPlayer.play();
                    } else {
                        console.log('No MP3 found for ' + countryName);
                        alert('No MP3 found for ' + countryName);
                    }
                })
                .catch(err => console.error('Error fetching MP3:', err));
        });

    // Fetch the countries data from TopoJSON and convert it to GeoJSON
    fetch('//unpkg.com/world-atlas/countries-110m.json')
        .then(response => response.json())
        .then(world => {
            const countriesGeoJson = topojson.feature(world, world.objects.countries);
            globe.polygonsData(countriesGeoJson.features);  // Add the GeoJSON features as polygons
        });
});
