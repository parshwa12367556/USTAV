import csv
import io


def parse_guest_csv(content: str) -> list[dict[str, str]]:
    try:
        reader = csv.DictReader(io.StringIO(content, newline=""), strict=True)
        if not reader.fieldnames:
            raise ValueError("CSV must include a header row.")
        headers = {
            header.strip().lower().replace("_", "").replace(" ", ""): header
            for header in reader.fieldnames
            if header
        }
        name_header = headers.get("name") or headers.get("guestname")
        if not name_header:
            raise ValueError("CSV must include a Name column.")

        rows: list[dict[str, str]] = []
        for line_number, row in enumerate(reader, start=2):
            name = (row.get(name_header) or "").strip()
            if not name:
                raise ValueError(f"Guest name is missing on row {line_number}.")
            normalized = {key: value for key, value in headers.items()}
            guest = {"name": name}
            email_header = normalized.get("email")
            phone_header = normalized.get("phone") or normalized.get("mobile")
            if email_header and (email := (row.get(email_header) or "").strip()):
                guest["email"] = email
            if phone_header and (phone := (row.get(phone_header) or "").strip()):
                guest["phone"] = phone
            rows.append(guest)
        return rows
    except csv.Error as error:
        raise ValueError("CSV is malformed.") from error
