@echo off
echo Starting Next.js build verification...
npm run build > build.log 2>&1
echo Build verification finished.
