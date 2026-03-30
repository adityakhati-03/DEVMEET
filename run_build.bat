@echo off
echo Starting production build check...
npm run build > build_check.log 2>&1
echo Build check complete.
