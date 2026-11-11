import re
lines = open("file_validation_service.py").read().splitlines()
for i, l in enumerate(lines):
    if re.match(r'^def |^class ', l.strip()):
        print(i + 1, l.strip())
