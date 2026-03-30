const testPiston = async () => {
    try {
        const resp = await fetch("https://emkc.org/api/v2/piston/execute", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "User-Agent": "DevMeet-Collaborative-Editor/1.0"
            },
            body: JSON.stringify({
                language: "javascript",
                version: "*",
                files: [
                    { name: "main.js", content: "console.log('Hello from Piston');" }
                ]
            })
        });
        
        console.log("Status:", resp.status);
        if (!resp.ok) {
            console.log("Error body:", await resp.text());
        } else {
            console.log("Success:", await resp.json());
        }
    } catch (e) {
        console.error("Fetch failed:", e);
    }
}
testPiston();
