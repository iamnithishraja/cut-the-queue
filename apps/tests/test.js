import http from "k6/http";

export const options = {
    scenarios: {
        intense: {
            executor: "ramping-vus",
            startVUs: 500,
            stages: [
                { duration: "30s", target: 2000 },
                { duration: "5m", target: 2000 },
                { duration: "30s", target: 3000 },
                { duration: "5m", target: 3000 },
            ],
        },
    },
    noConnectionReuse: true,
    discardResponseBodies: true,
};

export default function () {
    const headers = {
        Accept: "application/pdf",
        "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
        Connection: "keep-alive",
    };

    http.get("cuttheq.in", {
        headers,
        timeout: "30s",
    });
}