
const API_KEY = "AIzaSyBPM4b9ilrKvSOftVjKmVbG1Dd3UlTQRTM";

export async function getYoutubeInfo(videoId) {

    try {

        const url =
            `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoId}&key=${API_KEY}`;

        const res = await fetch(url);

        if (!res.ok) {
            throw new Error("Unable to connect to YouTube API.");
        }

        const data = await res.json();

        if (!data.items || data.items.length === 0) {
            throw new Error("Video not found.");
        }

        const item = data.items[0];

        return {

            title: item.snippet.title,

            description: item.snippet.description,

            thumbnail: item.snippet.thumbnails.high.url,

            publishedAt: item.snippet.publishedAt,

            duration: convertDuration(item.contentDetails.duration)

        };

    }

    catch (err) {

        console.error("YouTube API Error:", err);

        return null;

    }

}

// ===============================
// CONVERT ISO8601 DURATION
// PT1H20M10S  → 1:20:10
// PT5M13S     → 5:13
// PT45S       → 0:45
// ===============================

function convertDuration(duration) {

    const match = duration.match(
        /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/
    );

    if (!match) return "0:00";

    const hours = parseInt(match[1] || 0);
    const minutes = parseInt(match[2] || 0);
    const seconds = parseInt(match[3] || 0);

    if (hours > 0) {

        return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

    }

    return `${minutes}:${String(seconds).padStart(2, "0")}`;

}

// ===============================
// GET VIDEO ID FROM URL
// ===============================

export function getVideoId(url) {

    if (!url) return null;

    const regExp =
        /^.*(?:youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;

    const match = url.match(regExp);

    return (match && match[1].length === 11)
        ? match[1]
        : null;

}