const testWandbox = async () => {
    try {
        const resp = await fetch("https://wandbox.org/api/compile.json", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                compiler: "nodejs-head",
                code: "console.log('hi from wandbox');",
                stdin: ""
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
testWandbox();
