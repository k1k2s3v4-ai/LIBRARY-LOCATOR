async function initMap() {
    navigator.geolocation.getCurrentPosition(
        async function(position) {
            const userLocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };

            const map = new google.maps.Map(
                document.getElementById("map"),
                {
                    zoom: 15,
                    center: userLocation,
                    mapId: "94c9e648972c9a5772c61c99" // Replace with your Map ID
                }
            );

            // Import marker and pin libraries
            const { AdvancedMarkerElement, PinElement } = await google.maps.importLibrary("marker");

            // Create a distinct blue pin for "You are here"
            const userPin = new PinElement({
                background: "#4285F4",
                borderColor: "#1a73e8",
                glyphColor: "#ffffff"
            });

            // User Marker
            const userMarker = new AdvancedMarkerElement({
                position: userLocation,
                map: map,
                title: "You are here",
                content: userPin.element
            });

            // Info window for user location
            const userInfoWindow = new google.maps.InfoWindow({
                content: `<div style="padding: 4px; font-weight: bold; font-family: sans-serif;">Your location</div>`
            });

            // Track active info window
            let activeInfoWindow = null;

            // Hover event listeners for user location
            userMarker.element.addEventListener("mouseover", () => {
                if (activeInfoWindow) {
                    activeInfoWindow.close();
                }
                userInfoWindow.open(map, userMarker);
                activeInfoWindow = userInfoWindow;
            });

            userMarker.element.addEventListener("mouseout", () => {
                userInfoWindow.close();
                if (activeInfoWindow === userInfoWindow) {
                    activeInfoWindow = null;
                }
            });

            try {
                const {
                    Place,
                    SearchNearbyRankPreference
                } = await google.maps.importLibrary("places");

                const request = {
                    fields: [
                        "displayName",
                        "location",
                        "rating",
                        "userRatingCount"
                    ],
                    locationRestriction: {
                        center: userLocation,
                        radius: 3000
                    },
                    includedTypes: [
                        "library"
                    ],
                    rankPreference:
                        SearchNearbyRankPreference.POPULARITY
                };

                const { places } =
                    await Place.searchNearby(request);

                console.log("Places Found:", places);

                if (places && places.length > 0) {
                    // Loop through places and fetch photos asynchronously
                    for (const place of places) {
                        if (place.location) {
                            // Explicitly fetch the photos field for each place (Required by Places API New)
                            try {
                                await place.fetchFields({ fields: ["photos", "displayName"] });
                            } catch (err) {
                                console.error("Error fetching place photos:", err);
                            }

                            const marker =
                                new AdvancedMarkerElement({
                                    map: map,
                                    position: {
                                        lat: place.location.lat(),
                                        lng: place.location.lng()
                                    },
                                    title: place.displayName
                                });

                            // Format rating text safely
                            const ratingVal = place.rating ? place.rating : "N/A";
                            const reviewCount = place.userRatingCount ? place.userRatingCount : 0;

                            // Handle place photo if available
                            let photoHtml = "";
                            if (place.photos && place.photos.length > 0) {
                                const photoUrl = place.photos[0].getURI({ maxWidth: 300 });
                                photoHtml = `<img src="${photoUrl}" alt="${place.displayName}" style="width: 100%; height: 110px; object-fit: cover; border-radius: 4px; margin-bottom: 6px;" />`;
                            }

                            const infoWindow =
                                new google.maps.InfoWindow({
                                    content: `
                                        <div style="width: 180px; padding: 2px; font-family: sans-serif;">
                                            ${photoHtml}
                                            <h3 style="margin: 0 0 4px 0; font-size: 14px; font-weight: 600;">${place.displayName}</h3>
                                            <p style="margin: 0; font-size: 12px; color: #555;">
                                                ⭐ <strong>${ratingVal}</strong> (${reviewCount} reviews)
                                            </p>
                                        </div>
                                    `
                                });

                            // Show popup on hover (mouseover) and hide on mouseout
                            marker.element.addEventListener(
                                "mouseover",
                                () => {
                                    if (activeInfoWindow) {
                                        activeInfoWindow.close();
                                    }
                                    infoWindow.open(
                                        map,
                                        marker
                                    );
                                    activeInfoWindow = infoWindow;
                                }
                            );

                            marker.element.addEventListener(
                                "mouseout",
                                () => {
                                    infoWindow.close();
                                    if (activeInfoWindow === infoWindow) {
                                        activeInfoWindow = null;
                                    }
                                }
                            );
                        }
                    }
                } else {
                    alert(
                        "No libraries or study cafes found nearby."
                    );
                }
            } catch(error) {
                console.error(
                    "Places API Error:",
                    error
                );
            }
        },
        function(error) {
            console.error(
                "Location Error:",
                error
            );
        }
    );
}