lines = open("file_validation_service.py").read().splitlines()
count = 0
for i, l in enumerate(lines):
    count += l.count('"""')
    if count < 0:
        print("NEGATIVE at", i+1)
print("TOTAL triple-quote count:", count)
# Print lines containing triple quotes
for i, l in enumerate(lines):
    if '"""' in l:
        print(i+1, repr(l))
