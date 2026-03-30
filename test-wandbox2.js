const fs = require('fs');

async function checkWandbox() {
    try {
        console.log("Fetching list.json...");
        const res = await fetch("https://wandbox.org/api/list.json");
        const list = await res.json();
        const compilers = list.map(c => ({ name: c.name, compiler: c.compiler, language: c.language }));
        fs.writeFileSync("wandbox_compilers.json", JSON.stringify(compilers, null, 2));
        
        console.log("Testing nodejs...");
        const testRes = await fetch("https://wandbox.org/api/compile.json", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                compiler: "nodejs-head",
                code: "console.log('hi');"
            })
        });
        console.log("Nodejs test status:", testRes.status);
        console.log("Nodejs response:", await testRes.text());
        
    } catch (e) {
        console.error(e);
    }
}
checkWandbox();
