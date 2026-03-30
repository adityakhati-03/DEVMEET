const fetchCompilers = async () => {
    try {
        const resp = await fetch("https://wandbox.org/api/list.json");
        const data = await resp.json();
        
        // Group by language
        const langs = {};
        for (const c of data) {
            if (!langs[c.language]) {
                langs[c.language] = c.name;
            }
        }
        console.log(JSON.stringify(langs, null, 2));
    } catch (e) {
        console.error("Fetch failed:", e);
    }
}
fetchCompilers();
