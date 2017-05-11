        var map;
        var infoWindow;
        var searchBox;
        var markers = [];

        var showEvents = true;
        var showIncidents = true;

        function init() 
        {
            //Initialize popup
            var popTemp = document.getElementById("popup");
            document.getElementById("help").onclick = function(){
                if(popTemp.style.display == "none"){
                    popTemp.style.display = "block";
                }else{
                    popTemp.style.display = "none";
                }
            }
            document.getElementById("close").onclick = function(){
                popTemp.style.display = "none";
            }

            document.getElementById("incidents").onchange = function(){
                for(var i = 0; i < markers.length; i++){
                    if(markers[i].id == 2){
                        markers[i].setVisible(!markers[i].visible);
                    }
                }
            }

            document.getElementById("events").onclick = function(){
                for(var i = 0; i < markers.length; i++){
                    if(markers[i].id == 3){
                        markers[i].setVisible(!markers[i].visible);
                    }
                }
            }

            popTemp.style.display = "none";

            //Set up the search box
            var input = document.getElementById('searchterm');
            var searchButton = document.getElementById('search');
            searchBox = new google.maps.places.SearchBox(input);

            //Set up geolocation button
            document.getElementById("location").onclick = function(){
                if("geolocation" in navigator){
                    navigator.geolocation.getCurrentPosition(function(position){
                        var myLoc = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
                        map.setCenter(myLoc);
                        map.setZoom(10);
                        addMarker(position.coords.latitude,position.coords.longitude,"My Location","My Location","media/LocationPin.png",1);
                       
                       //Search for events in the area
                       var eventURL = "https://app.ticketmaster.com/discovery/v2/events.json?"; 
                        eventURL += "apikey=o5do3BLMNQ0Ht7640KC3zdqqZpU8mbGk";
                        eventURL += "&latlong=" + position.coords.latitude + "," + position.coords.longitude;
                        eventURL += "&unit=miles&radius=70&size=100";

                        $.ajax({
                            type:"GET",
                            url: eventURL,
                            async: true,
                            dataType: "json",
                            success: getEvents,
                            error: function(xhr, status, err){
                                console.log("Error loading TicketMaster API");
                            }
                        });

                        //Search for traffic incidents in the area
                        var neLat =  map.getBounds().getNorthEast().lat();   
                        var neLon  =  map.getBounds().getNorthEast().lng();
                        var swLat =  map.getBounds().getSouthWest().lat();   
                        var swLon  =  map.getBounds().getSouthWest().lng();   

                        var url = "https://www.mapquestapi.com/traffic/v2/incidents?&outFormat=json&boundingBox=";
                        url += neLat + ",";
                        url += neLon + ",";
                        url += swLat + ",";
                        url += swLon + ",";
                        url += "&key=i912Q0XOu1RVSVuyrZims6hfTFJV9dBu&filters=construction,incidents,event,congestion";

                        $.ajax({
                            dataType: "jsonp",
                            url: url,
                            data: null,
                            success: getData
                        });
                    });
                }
            }

            //Initialize the map
            var mapOptions = {
                center: {lat: 39.828127,lng: -98.579404},
                zoom: 4,
                streetViewControl:false,
                mapTypeControl:false
            };

            map = new google.maps.Map(document.getElementById('map'), mapOptions);

            function Search(){
                
                console.log(searchBox);

                var places = searchBox.getPlaces();
                console.log(places);

                if (places == undefined || places.length == 0) {
                    return;
                }


                // For each place, get the icon, name and location.
                var bounds = new google.maps.LatLngBounds();
                places.forEach(function(place) {
                    if (!place.geometry) {
                    return;
                    }
                    var icon = {
                    url: place.icon,
                    size: new google.maps.Size(71, 71),
                    origin: new google.maps.Point(0, 0),
                    anchor: new google.maps.Point(17, 34),
                    scaledSize: new google.maps.Size(25, 25)
                    };

                    if (place.geometry.viewport) {
                    // Only geocodes have viewport.
                    bounds.union(place.geometry.viewport);
                    } else {
                    bounds.extend(place.geometry.location);
                    }
                });
                map.fitBounds(bounds);

                var neLat =  map.getBounds().getNorthEast().lat();   
                var neLon  =  map.getBounds().getNorthEast().lng();
                var swLat =  map.getBounds().getSouthWest().lat();   
                var swLon  =  map.getBounds().getSouthWest().lng();   

                var eventURL = "https://app.ticketmaster.com/discovery/v2/events.json?"; 
                eventURL += "apikey=o5do3BLMNQ0Ht7640KC3zdqqZpU8mbGk";
                eventURL += "&latlong=" + (neLat + swLat)/2 + "," + (neLon + swLon)/2;
                eventURL += "&unit=miles&radius=70&size=100";

                $.ajax({
                    type:"GET",
                    url: eventURL,
                    async: true,
                    dataType: "json",
                    success: getEvents,
                    error: function(xhr, status, err){
                        console.log("Error loading TicketMaster API");
                    }
                });

                var url = "https://www.mapquestapi.com/traffic/v2/incidents?&outFormat=json&boundingBox=";
                url += neLat + ",";
                url += neLon + ",";
                url += swLat + ",";
                url += swLon + ",";
                url += "&key=i912Q0XOu1RVSVuyrZims6hfTFJV9dBu&filters=construction,incidents,event,congestion";

                $.ajax({
                    dataType: "jsonp",
                    url: url,
                    data: null,
                    success: getData
                });
            }

            searchBox.addListener('places_changed', Search);
        }

        function getData(obj)
        {
            if(obj.error){
                console.log("No Incidents Reported.");
			    return; // Bail out
		    }
            if(obj.total_items == 0){
                console.log("No results found");
                return; // Bail out
		    }

            var incidentDiv = document.getElementById('incidentDiv');

            //Show markers on the map
            console.log(obj);
            for(var i=0;i<obj.incidents.length;i++)
            {
                var incident = obj.incidents[i];

                //Create info window
                var infoWindowInfo = "<h1>";
                var incidentTitle;
                switch(incident.type)
                {
                    case 1:
                        incidentTitle = "Construction";
                        break;
                    case 2:
                        incidentTitle = "Event";
                        break;
                    case 3:
                        incidentTitle = "Congestion/Flow";
                        break;
                    case 4:
                        incidentTitle = "Accident";
                        break;
                }
                infoWindowInfo += incidentTitle;
                infoWindowInfo += "</h1>"
                infoWindowInfo += "<h3>" + incident.startTime + " -- " + incident.endTime + "</h3>";
                infoWindowInfo += "<p>" + incident.fullDesc + "</p><hr>";
                infoWindowInfo += "<h3>Incident Severity: " + incident.severity + "/4</h3>";
                if(incident.impacting)
                {
                    infoWindowInfo += "<p>This incident is impacting traffic.</p>";
                }
                else
                {
                    infoWindowInfo += "<p>This incident is not impacting traffic.</p>";
                }
                addMarker(incident.lat,incident.lng,"Incident",infoWindowInfo,"media/WarningPin.png"/*"http://api.mqcdn.com/mqtraffic/const_mod.png"*/,2);
            }
        }

        //Gets all events in the area from the
        //TicketMaster API
        function getEvents(obj){
            if(obj._embedded == undefined){
                console.log("No events found.");
                return;
		    }
            if(obj.error){
                console.log("Error: No events found.");
			    return;
		    }

            //Show markers on the map
            console.log(obj);
            console.log(obj._embedded.events.length);
            for(var i=0;i<obj._embedded.events.length;i++)
            {
                var event = obj._embedded.events[i];
                //Create info window
                var infoWindowInfo = "<h1>" + event.name + "</h1>";
                infoWindowInfo += "<h3>" + event._embedded.venues[0].name + "</h3>";
                infoWindowInfo += "<h3>" + event.dates.start.localDate + "</h3><hr>";
                if(event.info){
                    infoWindowInfo += "<p>" + event.info + "</p>";
                }else{
                    infoWindowInfo += "<p>No description available.</p>";
                }
                infoWindowInfo += "<a href='" + event.url + "'>Purchase Tickets</a>";
                addMarker(parseFloat(event._embedded.venues[0].location.latitude),parseFloat(event._embedded.venues[0].location.longitude),"Event",infoWindowInfo,"media/EventPin.png",3);
            }
        }

        //Adds a marker to the map of an event
        function addMarker(latitude,longitude,title,info,icon,id)
        {
            var position = {lat:latitude,lng:longitude};
            var marker = new google.maps.Marker({
                position: position,
                icon: icon,
                map: map,
                id: id
            });
            markers.push(marker);
            marker.setTitle(title);
            google.maps.event.addListener(marker,'click',function(e){
                makeInfoWindow(position,info);
                map.panTo(position);
                
            });
        }

        //Makes an info window
        function makeInfoWindow(position,msg)
        {
            if(infoWindow) infoWindow.close();

            infoWindow = new google.maps.InfoWindow({
                map:map,
                position:position,
                content: "<b>" + msg + "</b>"
            });
        }

        function drawPolygons(paths,title)
        {
            var path = new google.maps.Polygon({
                paths: paths,
                strokeColor: '#FFF',
                strokeOpacity: 0.8,
                strokeWeight:2,
                fillColor: '#FF0000',
                fillOpacity: 0.35,
                title:title
            });
            path.setMap(map);
        }