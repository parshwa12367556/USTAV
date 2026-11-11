lines = open("file_validation_service.py").read().splitlines()
depth = 0
pairs = []
for i, l in enumerate(lines):
    n = l.count('"""')
    # Each line may toggle multiple times; count sequentially
    for _ in range(n):
        if depth % 2 == 0:
            depth += 1  # open
        else:
            depth -= 1  # close
        pairs.append((i + 1, depth, 2 if depth % 2 == 1 else 1))
print("final depth:", depth)
# Find mismatch: lines that open or close unexpectedly
for ln, d, kind in pairs:
    status = "open" if kind == 2 else "close"
    print(ln, d, status)
