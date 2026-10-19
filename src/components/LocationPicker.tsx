"use client";

import { useState } from "react";
import { LocateFixed } from "lucide-react";
import { PLACES } from "@/lib/places";

type Location = { latitude: string; longitude: string; label: string };

// Lets a donor share their GPS location, or pick their dzongkhag/town.
// Submits three fields: latitude, longitude, location_label.
export function LocationPicker({ initial }: { initial?: Location }) {
  const [location, setLocation] = useState<Location>(
    initial ?? { latitude: "", longitude: "", label: "" },
  );
  const [status, setStatus] = useState("");

  function useGps() {
    if (!navigator.geolocation) {
      setStatus("Your browser can't share location. Please pick a place instead.");
      return;
    }
    setStatus("Getting your location…");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          latitude: pos.coords.latitude.toFixed(5),
          longitude: pos.coords.longitude.toFixed(5),
          label: "My GPS location",
        });
        setStatus("");
      },
      () => setStatus("Couldn't get your location. Please pick a place instead."),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  function pickPlace(name: string) {
    const place = PLACES.find((p) => p.name === name);
    if (place) {
      setLocation({ latitude: String(place.lat), longitude: String(place.lng), label: place.name });
      setStatus("");
    }
  }

  const placeValue = PLACES.some((p) => p.name === location.label) ? location.label : "";

  return (
    <fieldset className="space-y-2">
      <legend className="label">Location</legend>
      <div className="flex flex-col gap-2 sm:flex-row">
        <select
          className="input sm:flex-1"
          value={placeValue}
          onChange={(e) => pickPlace(e.target.value)}
          aria-label="Dzongkhag or town"
        >
          <option value="">Select dzongkhag / town…</option>
          {PLACES.map((p) => (
            <option key={p.name} value={p.name}>
              {p.name}
            </option>
          ))}
        </select>
        <button type="button" onClick={useGps} className="btn-secondary">
          <LocateFixed className="h-4 w-4" /> Use current location
        </button>
      </div>

      <input type="hidden" name="latitude" value={location.latitude} />
      <input type="hidden" name="longitude" value={location.longitude} />
      <input type="hidden" name="location_label" value={location.label} />

      <p className="text-xs text-slate-500">
        {status ||
          (location.latitude
            ? `Selected: ${location.label} (${location.latitude}, ${location.longitude})`
            : "Used only to find donors near a hospital. Never shown publicly.")}
      </p>
    </fieldset>
  );
}
