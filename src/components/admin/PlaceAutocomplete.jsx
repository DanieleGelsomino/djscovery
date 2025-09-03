import React, { useEffect, useState, useRef } from "react";
import { Autocomplete as MUIAutocomplete, TextField, Stack, Typography, InputAdornment } from "@mui/material";
import PlaceIcon from "@mui/icons-material/Place";

function PlaceAutocomplete({
                               value,
                               onChange,
                               inputValue,
                               onInputChange,
                               error,
                               helperText,
                               onCoords,
                           }) {
    const [preds, setPreds] = useState([]);
    const [loading, setLoading] = useState(false);
    const [initError, setInitError] = useState("");
    const abortRef = useRef(null);
    const debounceRef = useRef(null);

    const apiKey =
        (import.meta?.env && import.meta.env.VITE_GEOAPIFY_KEY) ||
        (window.APP_CONFIG && window.APP_CONFIG.GEOAPIFY_KEY);

    useEffect(() => {
        if (!apiKey) setInitError("Geoapify API key mancante");
    }, [apiKey]);

    useEffect(() => {
        const q = (inputValue || "").trim();
        if (!apiKey) return;
        if (!q) {
            setPreds([]);
            return;
        }
        setLoading(true);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(async () => {
            try {
                if (abortRef.current) abortRef.current.abort();
                abortRef.current = new AbortController();

                const url = new URL("https://api.geoapify.com/v1/geocode/autocomplete");
                url.searchParams.set("text", q);
                url.searchParams.set("limit", "7");
                url.searchParams.set("lang", "it");
                // opzionale: restrizione paese → Italia
                // url.searchParams.set("filter", "countrycode:it");
                url.searchParams.set("apiKey", apiKey);

                const r = await fetch(url.toString(), { signal: abortRef.current.signal });
                const data = await r.json();
                const rows = (data?.features || []).map((f) => {
                    const p = f.properties || {};
                    return {
                        label: p.formatted || p.address_line1 || p.name || "",
                        place_id: p.place_id || p.datasource?.raw?.osm_id || p.osm_id || p.datasource?.feature_id || Math.random().toString(36).slice(2),
                        main_text: p.address_line1 || p.name || p.street || "",
                        secondary_text: p.address_line2 || [p.postcode, p.city, p.country].filter(Boolean).join(" "),
                        lat: p.lat,
                        lon: p.lon,
                    };
                });
                setPreds(rows);
            } catch (e) {
                if (e?.name !== "AbortError") {
                    setPreds([]);
                }
            } finally {
                setLoading(false);
            }
        }, 220);

        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
            if (abortRef.current) abortRef.current.abort();
        };
    }, [inputValue, apiKey]);

    const selectOption = (_evt, opt) => {
        if (!opt) {
            onChange(null);
            onCoords?.(null);
            return;
        }
        onChange({
            label: opt.label,
            place_id: opt.place_id,
            verified: true,
            lat: opt.lat,
            lon: opt.lon,
        });
        if (opt.lat && opt.lon) onCoords?.({ lat: opt.lat, lon: opt.lon });
    };

    return (
        <MUIAutocomplete
            options={preds}
            value={value}
            onChange={selectOption}
            inputValue={inputValue}
            onInputChange={(e, v) => onInputChange(v)}
            getOptionLabel={(o) => o?.label || ""}
            noOptionsText={initError ? "Geoapify non configurato" : "Nessun risultato"}
            loading={loading}
            clearOnBlur={false}
            blurOnSelect
            isOptionEqualToValue={(o, v) => o.place_id === v.place_id}
            renderOption={(props, option) => (
                <li {...props} key={option.place_id}>
                    <Stack>
                        <Typography variant="body2" fontWeight={600}>
                            {option.main_text || option.label}
                        </Typography>
                        {option.secondary_text && (
                            <Typography variant="caption" sx={{ opacity: 0.8 }}>
                                {option.secondary_text}
                            </Typography>
                        )}
                    </Stack>
                </li>
            )}
            renderInput={(params) => {
                const { InputProps, ...rest } = params;
                return (
                    <TextField
                        {...rest}
                        label="Cerca e seleziona un luogo"
                        required
                        error={!!error || !!initError}
                        helperText={initError || helperText || "Suggerimenti da OSM/Geoapify"}
                        InputProps={{
                            ...InputProps,
                            startAdornment: (
                                <InputAdornment position="start">
                                    <PlaceIcon fontSize="small" />
                                </InputAdornment>
                            ),
                        }}
                        sx={{
                            "& .MuiOutlinedInput-root": {
                                "& fieldset": { borderColor: "rgba(255,255,255,0.18)" },
                                "&:hover fieldset": { borderColor: "primary.main" },
                                "&.Mui-focused fieldset": { borderColor: "primary.main" },
                            },
                        }}
                    />
                );
            }}
        />
    );
}

export default PlaceAutocomplete;
