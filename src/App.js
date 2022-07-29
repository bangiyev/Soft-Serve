import React from "react";
import {
  GoogleMap,
  useLoadScript,
  Marker,
  InfoWindow,
  Circle,
  MarkerClusterer,
  DirectionsRenderer,
} from "@react-google-maps/api";
import { add, formatRelative } from "date-fns";
/*
  formatRelative formats time relative to current time.
  Takes 2 dates as parameters, compares them, and makes a string of a date (when the 
    event occured in relation to current time)
*/
import { ToastContainer, toast } from "react-toastify";
import "@reach/combobox/styles.css";
import { useEffect, useCallback, useMemo, useState, useRef } from "react";
import mapStyles from "./mapStyles";
import "./App.css";

import usePlacesAutocomplete, {
  getGeocode,
  getLatLng,
} from "use-places-autocomplete";
import {
  Combobox,
  ComboboxInput,
  ComboboxPopover,
  ComboboxList,
  ComboboxOption,
} from "@reach/combobox";
import "@reach/combobox/styles.css";

// const google = window.google;

const mapContainerStyle = {
  // set width and height of the div they put around the googleMap
  // map takes up the space of the container it's in
  width: "100vw",
  height: "100vh",
};

const libraries = ["places"];

function App() {
  // Load Script for map
  /*
    useLoadScript hook is the first thing here to set up the google script. 
    in browser, inspect elements of <head>, you'll see google maps api in a script tag.
    useLoadscript puts it there for you

  */
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries,
  });
  const [markers, setMarkers] = useState([]);
  /*
    There are 2 ways to use setMarkers.
    1) you can just pass in the new state like setMarkers([])
    2) if the new state is based on the previous state, you can pass a function in
      Where the old state is passed to you as a value like:

      setMarkers(current => [...current, {lat: event.latlng.lat(), lng: event.latlng.lng(), time: new Date()}])
  */

  useEffect(() => {
    let fetched = true;
    const getMarkers = async () => {
      const markersFromServer = await fetchMarkers();
      if (fetched) {
        setMarkers(markersFromServer);
      }
    };
    getMarkers();
    return () => (fetched = false);
  }, []);

  const fetchMarkers = async () => {
    const res = await fetch("http://localhost:5000/markers");
    const data = await res.json();
    return data;
  };

  // state to store the current selected marker the user wants to see details for.
  // starts as null and gets a value when the user clicks a marker
  const [selectedMarker, setSelectedMarker] = useState(null);

  const [userLocation, setUserLocation] = useState();

  // On launch, opens map to this point
  const center = useMemo(() => ({ lat: 40.712776, lng: -74.005974 }), []);
  // GoogleMap options
  const options = useMemo(
    () => ({
      disableDefaultUI: true,
      clickableIcons: false,
      styles: mapStyles,
      zoomControl: true,
    }),
    []
  );

  /*
    To avoid recreating the onClick => set markers function on every render
    of the application: need useCallback Hook
    Functions defined inside of a component should be wrapped with useCallback
    useCallback is used when you want to define a function that shouldn't ever change
    unless the properties passed into dependency array changes.
    if you do nothing at all, the function will retain the same value, never triggering
    a re-render because of react thinking it's different value
  */

  const onMapClick = async (event) => {
    const newMarker = {
      lat: event.latLng.lat(),
      lng: event.latLng.lng(),
      time: new Date(),
    };
    markDb(newMarker);
  };

  const markDb = async (newMarker) => {
    const res = await fetch("http://localhost:5000/markers", {
      method: "POST",
      headers: {
        "Content-type": "application/json",
      },
      body: JSON.stringify(newMarker),
    });
    const data = await res.json();
    console.log(data);
    setMarkers([...markers, data]);
    // console.log(markers);
  };

  // original func w/o db

  // const onMapClick = useCallback(
  //   (event) => {
  //     setMarkers(
  //       (current) => [
  //         ...current,
  //         {
  //           lat: event.latLng.lat(),
  //           lng: event.latLng.lng(),
  //           time: new Date(),
  //         },
  //       ],
  //       console.log(markers)
  //     );
  //   },
  //   [markers]
  // );

  // To retain a ref to the map instance. Used for when searching, pan and zoom the map
  const mapRef = useRef();
  // callback func to be passed in when the map loads. gives us the map that we can
  // assign to the ref to be used later without causing re-renders.
  // useCallback receives as a paramter the map itself, as passed from the GoogleMap component
  const onMapLoad = useCallback((map) => {
    mapRef.current = map;
    // by saving this reference to the map to useRef, we can access it anywhere
    // we want in the code, and it wont cause any re-renders.
    // use state when you want to cause re-renders
    // use ref when you want to retain state without causing re-renders
  }, []);

  // To show markers on the map, you render them inside the GoogleMap component
  // Markers.map. For each marker, show a marker component that comes with the GoogleMaps package
  // Markers need a key (change it to ID later, but for now 'time' is fine). since we're iterating,
  // key must be unique for react.

  // Marker onClick event receives a function that's called when the user clicks
  // Call setSelected to set the marker as its iterating and drawing the markers on the map
  // it will pass in the marker that was clicked, aligning with the marker being rendered

  // infoWindow takes 1 child, so you can put in a div and put any html code you want in it

  const deleteMarker = async (clickedMarker) => {
    await fetch(`http://localhost:5000/markers/${clickedMarker.id}`, {
      method: "DELETE",
    });
    setMarkers(markers.filter((marker) => marker.id !== clickedMarker.id));
  };

  // original delete func before db

  // const deleteMarker = (clickedMarker) => {
  //   setMarkers(
  //     markers.filter(
  //       (marker) =>
  //         marker.lat !== clickedMarker.lat && marker.lng !== clickedMarker.lng
  //     )
  //   );
  // };

  // useCallback so that it only ever creates one of these functions
  // no dependency array - never need to change the definition of this function
  // pass moveMapTo function as a prop to the search component so that the search Function can receive the prop: moveMapTo
  const moveMapTo = useCallback(({ lat, lng }) => {
    mapRef.current.panTo({ lat, lng });
    mapRef.current.setZoom(15);
  }, []);

  const getDirections = async (marker) => {
    {
      userLocation
        ? console.log("get directions")
        : console.log("no location set"); // notify that theres no location set
    }
  };

  //   const service = new google.maps.DirectionsService();
  //   service.route({

  //     origin:
  //     destination: {lat: marker.lat, lng: marker.lng},
  //   }
  //   )
  // };

  if (loadError) return "Error loading maps";
  if (!isLoaded) return "Loading maps";
  // No hooks beneath IF statements

  return (
    <div>
      <h1>Logo</h1>
      <Search moveMapTo={moveMapTo} />
      <FindUser moveMapTo={moveMapTo} setUserLocation={setUserLocation} />
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        zoom={9}
        center={center}
        options={options}
        onClick={onMapClick}
        onLoad={onMapLoad}
      >
        {userLocation && (
          <>
            <Marker
              position={userLocation}
              icon={{
                url: `/userPin.svg`,
                origin: new window.google.maps.Point(0, 0),
                anchor: new window.google.maps.Point(15, 15),
                scaledSize: new window.google.maps.Size(30, 30),
              }}
            />
            <Circle
              center={userLocation}
              radius={1000}
              options={circleOptionsNear}
            />
            <Circle
              center={userLocation}
              radius={2500}
              options={circleOptionsFar}
            />
          </>
        )}

        {markers.map((marker) => (
          <Marker
            icon={{
              url: `/iceCreamMarker.svg`,
              origin: new window.google.maps.Point(0, 0),
              anchor: new window.google.maps.Point(15, 15),
              scaledSize: new window.google.maps.Size(30, 30),
            }}
            key={marker.id} // marker.time.toISOString()
            //time={marker.time.toISOString()}
            position={{ lat: marker.lat, lng: marker.lng }}
            //opacity={0.65}
            onClick={() => {
              setSelectedMarker(marker);
            }}
            onRightClick={() => {
              deleteMarker(marker);
            }}
          />
        ))}

        {selectedMarker ? (
          <InfoWindow
            position={{ lat: selectedMarker.lat, lng: selectedMarker.lng }}
            onCloseClick={() => {
              setSelectedMarker(null);
            }} //When you close the window, unselect the marker
          >
            <div>
              <h2> Truck reported</h2>
              <p>Reported at {selectedMarker.time}</p>
              <button
                onClick={() => {
                  getDirections(selectedMarker);
                }}
              >
                Get Directions
              </button>
            </div>
          </InfoWindow>
        ) : null}
      </GoogleMap>
    </div>
  );
}

// formatRelative(selectedMarker.time, new Date())

// requestoptions: if the user searches, it will prefer places near the location
// that you're passing into requestOptions
// it actually wants to receive functions that you call to get the lat lng values, so you can
// just use empty arrow functions and have them return the set value.
// When using requestOptions, need to pass a radius - how far around the midpoint do you
// want to prefer locations for. It wants it in meters. 200km * 1000meters

// usePlacesAutocomplete is a hook that returns a number of variables in an object that you can deconstruct the values from
// ready - is this thing set up and ready to go? googleSearch scripts loaded with correct libraries? -useLoadScript handled this earlier
// value - current value that the user is typing into the searchbox
// suggestions - what suggestions is the user getting back from google's API? {status, data of the suggestion}
// function to set the value
// function to clear suggestions

//ComboboxInput - whenever you have an input you wanna control with react, you need to give it
// a value to display. This app gets the value from the usePlacesAutocomplete hook
// Also need to listen for when it changes. Put in arrw func that receives the event and does something with that event
// In this case, it calls the setValue function from usePlacesAutocomplete & pass in the value inside the event
// Dont want comboboxinput enabled unless usplacesauto is ready

// findUser is a component for a button.
// getCurrentPosition gives 2 callback function. If theres an error, just handle it with a function that does nothing.
// success function will do something
// .getCurrentPosition( ()=>{}, ()=> null  )  ---- (success, error, options) -- not using options
// success function gives a value we can call position
function FindUser({ moveMapTo, setUserLocation, countMarkersAroundUser }) {
  return (
    <button
      className="findUser"
      onClick={() => {
        const result = navigator.geolocation.getCurrentPosition(
          (position) => {
            moveMapTo({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            });
            setUserLocation({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            });
            countMarkersAroundUser({});
          },
          () => null
        );
      }}
    >
      <img src="location.svg" alt="locate me" />
    </button>
  );
}

function Search({ moveMapTo }) {
  const {
    ready,
    value,
    suggestions: { status, data },
    setValue,
    clearSuggestions,
  } = usePlacesAutocomplete({
    requestOptions: {
      location: { lat: () => 40.584221, lng: () => -73.820343 },
      radius: 200 * 1000,
    },
  });

  // Search function returns a reach Combobox
  // onSelect receives the address/item that the user selected.
  // onSelect will be made async because we're using promises (optional)
  // try catch in case there is an error (rejected promise)

  // getGeocode returns results that you have to wait for, because it's a promise
  // getGeocode takes an object that has an address property, which is the address received in combobox onSelect

  // getLatLng extracts lat and lng from the result of getGeocode. it's not asynchronous

  //comboboxPopover receives all the suggestions that google places gives
  // if status is OK, map over the suggestions
  // each suggestion has an ID and a description. in data.map, for each suggestion, deconstruct ID & desc and render
  // a comboboxOption, which needs a key since we're mapping, and value which is a description

  /* 
    When a user clicks on an address from the suggestions, call setValue to update state and place whatever they chose in there.
    False = does the above without fetching new data from google.
    Then clear suggestions so they arent shown anymore to the user
    Then use the selected address in the getGeocode function to get results.
    Use getLatLng on the first result to get lat lng.
    use MoveMapTo function on the lat lng to move the map.  
  */
  return (
    <div className="search">
      <Combobox
        onSelect={async (address) => {
          setValue(address, false); // set the value to whatever address the user selected. False: shouldFetchData? - already know the value the user selected
          clearSuggestions(); // no longer shows suggestions to user
          try {
            const results = await getGeocode({ address });
            const { lat, lng } = await getLatLng(results[0]);
            moveMapTo({ lat, lng });
          } catch (error) {
            console.log(error);
          }
        }}
      >
        <ComboboxInput
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
          }}
          disabled={!ready}
          placeholder="Search"
          // These are all properites of an <input>, not specific to combobox
        />

        <ComboboxPopover className="popover">
          <ComboboxList>
            {status === "OK" &&
              data.map(({ id, description }) => (
                <ComboboxOption key={id + description} value={description} /> // just using id as a key gives uniqueness error.
              ))}
          </ComboboxList>
        </ComboboxPopover>
      </Combobox>
    </div>
  );
}

const circleOptionsDefault = {
  strokeOpacity: 0.5,
  strokeWeight: 2,
  clickable: false,
  draggable: false,
  editable: false,
  visible: true,
};
const circleOptionsNear = {
  ...circleOptionsDefault,
  zIndex: 3,
  fillOpacity: 0.03,
  strokeColor: "#70d8e6",
  fillColor: "#70d8e6",
};
const circleOptionsFar = {
  ...circleOptionsDefault,
  zIndex: 1,
  fillOpacity: 0.03,
  strokeColor: "#FF5252",
  fillColor: "#FF5252",
};

export default App;
