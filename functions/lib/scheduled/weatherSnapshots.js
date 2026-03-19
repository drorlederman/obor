"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.refreshWeatherSnapshotNow = exports.weatherSnapshots = void 0;
const firestore_1 = require("firebase-admin/firestore");
const https_1 = require("firebase-functions/v2/https");
const scheduler_1 = require("firebase-functions/v2/scheduler");
const auth_1 = require("../shared/auth");
const errors_1 = require("../shared/errors");
function toNumber(value) {
    return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}
async function geocodeMarina(name) {
    const geocodeUrl = `https://geocoding-api.open-meteo.com/v1/search?count=1&language=he&format=json&name=${encodeURIComponent(name)}`;
    try {
        const response = await fetch(geocodeUrl);
        if (!response.ok)
            return null;
        const json = (await response.json());
        const first = json.results?.[0];
        if (!first)
            return null;
        const label = [first.name, first.country].filter(Boolean).join(', ');
        return { lat: first.latitude, lon: first.longitude, label: label || name };
    }
    catch {
        return null;
    }
}
async function fetchWind(lat, lon) {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
        '&hourly=wind_speed_10m,wind_gusts_10m,wind_direction_10m' +
        '&wind_speed_unit=kn&forecast_days=2&timezone=auto';
    try {
        const response = await fetch(url);
        if (!response.ok)
            return null;
        return (await response.json());
    }
    catch {
        return null;
    }
}
async function fetchMarine(lat, lon) {
    const url = `https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lon}` +
        '&hourly=wave_height,wave_direction,wave_period&forecast_days=2&timezone=auto';
    try {
        const response = await fetch(url);
        if (!response.ok)
            return null;
        return (await response.json());
    }
    catch {
        return null;
    }
}
function buildTimeline(wind, marine) {
    const windHourly = wind.hourly;
    if (!windHourly?.time?.length)
        return [];
    const marineByTime = new Map();
    const marineHourly = marine.hourly;
    if (marineHourly?.time?.length) {
        marineHourly.time.forEach((time, index) => {
            marineByTime.set(time, {
                waveHeightMeters: toNumber(marineHourly.wave_height?.[index]),
                waveDirectionDegrees: toNumber(marineHourly.wave_direction?.[index]),
                wavePeriodSeconds: toNumber(marineHourly.wave_period?.[index]),
            });
        });
    }
    const merged = windHourly.time.map((time, index) => {
        const wave = marineByTime.get(time);
        return {
            at: new Date(time).toISOString(),
            windKnots: toNumber(windHourly.wind_speed_10m?.[index]),
            gustKnots: toNumber(windHourly.wind_gusts_10m?.[index]),
            waveHeightMeters: wave?.waveHeightMeters ?? 0,
            waveDirectionDegrees: wave?.waveDirectionDegrees ?? 0,
            wavePeriodSeconds: wave?.wavePeriodSeconds ?? 0,
        };
    });
    const now = Date.now();
    const currentIndex = merged.findIndex((point) => new Date(point.at).getTime() >= now);
    const start = currentIndex === -1 ? 0 : currentIndex;
    return merged.slice(start, start + 12);
}
async function updateBoatWeatherSnapshot(boatId) {
    const db = (0, firestore_1.getFirestore)();
    const boatSnap = await db.doc(`boats/${boatId}`).get();
    if (!boatSnap.exists)
        return 'skipped';
    const boatData = boatSnap.data();
    const homeMarina = (boatData?.homeMarina ?? '').trim();
    const boatStatus = boatData?.status ?? 'active';
    if (!homeMarina)
        return 'skipped';
    if (!['active', 'maintenance'].includes(boatStatus))
        return 'skipped';
    const weatherSettingsRef = db.doc(`system_settings/${boatId}_weather`);
    const weatherSettingsSnap = await weatherSettingsRef.get();
    const weatherSettings = weatherSettingsSnap.data() ?? {};
    let lat = weatherSettings.locationLat;
    let lon = weatherSettings.locationLng;
    let locationLabel = weatherSettings.locationLabel ?? homeMarina;
    if (typeof lat !== 'number' || typeof lon !== 'number') {
        const geocode = await geocodeMarina(homeMarina);
        if (!geocode)
            return 'skipped';
        lat = geocode.lat;
        lon = geocode.lon;
        locationLabel = geocode.label;
        await weatherSettingsRef.set({
            boatId,
            type: 'weather',
            locationLat: lat,
            locationLng: lon,
            locationLabel,
            updatedAt: firestore_1.FieldValue.serverTimestamp(),
        }, { merge: true });
    }
    const [wind, marine] = await Promise.all([fetchWind(lat, lon), fetchMarine(lat, lon)]);
    if (!wind || !marine)
        return 'skipped';
    const timeline = buildTimeline(wind, marine);
    if (timeline.length === 0)
        return 'skipped';
    const generatedAtIso = new Date().toISOString();
    const current = timeline[0];
    await db.doc(`weather_snapshots/${boatId}`).set({
        boatId,
        source: 'open-meteo',
        homeMarina,
        location: {
            lat,
            lon,
            label: locationLabel,
        },
        current,
        timeline,
        generatedAt: generatedAtIso,
        updatedAt: firestore_1.FieldValue.serverTimestamp(),
    }, { merge: true });
    return 'updated';
}
exports.weatherSnapshots = (0, scheduler_1.onSchedule)('every 60 minutes', async () => {
    const db = (0, firestore_1.getFirestore)();
    const boatsSnap = await db
        .collection('boats')
        .where('status', 'in', ['active', 'maintenance'])
        .get();
    if (boatsSnap.empty)
        return;
    let updatedCount = 0;
    await Promise.allSettled(boatsSnap.docs.map(async (boatDoc) => {
        const boatId = boatDoc.id;
        const result = await updateBoatWeatherSnapshot(boatId);
        if (result === 'updated') {
            updatedCount++;
        }
    }));
    console.log(`weatherSnapshots: updated ${updatedCount} boats`);
});
exports.refreshWeatherSnapshotNow = (0, https_1.onCall)(async (request) => {
    const boatId = request.data?.boatId ?? '';
    if (!boatId?.trim()) {
        throw errors_1.Errors.invalidArgument('מזהה סירה חסר');
    }
    await (0, auth_1.ensureAdmin)(request, boatId);
    try {
        const result = await updateBoatWeatherSnapshot(boatId);
        if (result !== 'updated') {
            throw errors_1.Errors.preconditionFailed('לא ניתן לרענן תחזית. בדוק שמוגדרת מרינה תקינה לסירה');
        }
    }
    catch (err) {
        if (err?.code) {
            throw err;
        }
        throw errors_1.Errors.internal('שגיאה ברענון נתוני מזג האוויר, נסה שוב בעוד כמה דקות');
    }
    return { success: true };
});
//# sourceMappingURL=weatherSnapshots.js.map