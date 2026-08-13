#!/bin/bash
echo "--- Building Wood-booster OS C++ Core ---"
npx node-gyp rebuild

if [ $? -eq 0 ]; then
    echo "--- Build Successful! Running Core Tests ---"
    npx tsx src/test_core.ts
else
    echo "--- Build Failed! Check compilation errors above. ---"
    exit 1
fi
