import ast

with open("file_validation_service.py") as f:
    src = f.read()

tree = ast.parse(src)

for node in ast.walk(tree):
    if isinstance(node, (ast.FunctionDef, ast.ClassDef)):
        print(node.lineno, node.name, "func" if isinstance(node, ast.FunctionDef) else "class")

print("TOTAL_LINES", len(src.splitlines()) + 1)


lines = open("file_validation_service.py").read().splitlines()
print("=== LINES 55-72 ===")
for i in range(54, 72):
    print(i + 1, repr(lines[i]))
