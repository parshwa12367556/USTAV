import smtplib
from email.message import EmailMessage

from flask import current_app

from app.core.exceptions import ServiceUnavailable


def send_verification_code(recipient: str, code: str) -> None:
    mode = current_app.config["OTP_DELIVERY_MODE"]
    if mode == "console" and current_app.config["DEBUG"]:
        current_app.logger.info("Development verification code for %s: %s", recipient, code)
        return
    if mode != "smtp":
        raise ServiceUnavailable("Email delivery is not configured. Contact the administrator.")

    mail_server = current_app.config.get("MAIL_SERVER")
    sender = current_app.config.get("MAIL_DEFAULT_SENDER")
    if not mail_server or not sender:
        raise ServiceUnavailable("Email delivery is not configured. Contact the administrator.")

    message = EmailMessage()
    message["Subject"] = "Your Utsav security code"
    message["From"] = sender
    message["To"] = recipient
    expiry_minutes = current_app.config["OTP_EXPIRY_MINUTES"]
    message.set_content(
        f"Your Utsav security code is {code}. It expires in {expiry_minutes} minutes."
    )
    try:
        with smtplib.SMTP(mail_server, current_app.config["MAIL_PORT"], timeout=10) as smtp:
            if current_app.config["MAIL_USE_TLS"]:
                smtp.starttls()
            username = current_app.config.get("MAIL_USERNAME")
            password = current_app.config.get("MAIL_PASSWORD")
            if username and password:
                smtp.login(username, password)
            smtp.send_message(message)
    except (OSError, smtplib.SMTPException) as error:
        current_app.logger.exception("Could not send verification email to %s", recipient)
        raise ServiceUnavailable("Verification email could not be sent. Please try again later.") from error
