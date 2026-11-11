lines = open("file_validation_service.py").read().splitlines()
print("=== LINES 55-72 ===")
for i in range(54, 72):
    print(i + 1, repr(lines[i]))
