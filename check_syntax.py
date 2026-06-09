#!/usr/bin/env python
import py_compile
import sys

files = [
    'apps/jobs/views.py',
    'apps/jobs/services.py', 
    'apps/accounts/documents.py'
]

errors = []
for f in files:
    try:
        py_compile.compile(f, doraise=True)
        print(f"✓ {f}")
    except py_compile.PyCompileError as e:
        print(f"✗ {f}: {e}")
        errors.append(f)

if errors:
    print(f"\n{len(errors)} file(s) with syntax errors")
    sys.exit(1)
else:
    print("\nAll files OK")
