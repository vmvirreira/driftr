document.addEventListener('DOMContentLoaded', () => {
    const audioPlayer = document.getElementById('audio-player');

    // Initialize the globe
    const globe = Globe()(document.getElementById('globe-container'))
        .globeImageUrl('//unpkg.com/three-globe/example/img/earth-dark.jpg')
        .polygonCapColor((country) => 'rgba(0, 100, 255, 0.6)')
        .polygonLabel(({ properties: d }) => {
            console.log(d);  // Log the country properties to check the structure
            return `${d.name || 'Unknown Country'}`;  // Attempt to use a fallback for the country name
        })
        .onGlobeClick((country) => {
            const countryName = country.properties.name || 'Unknown Country';
            console.log("Clicked country:", countryName);  // Debugging log to check country name
            // Fetch MP3 link from the Flask backend
            fetch(`/api/mp3/${countryName}`)
                .then(response => response.json())
                .then(data => {
                    if (data.mp3_link) {
                        // Play the MP3 in the audio control
                        audioPlayer.src = data.mp3_link;
                        audioPlayer.play();
                    } else {
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
            globe.polygonsData(countriesGeoJson.features);
        });
});
