# Mobile architecture status

## Current status: not implemented

The repository contains a responsive web application but no native Android or iOS application, mobile-specific source tree, native build configuration, or mobile CI workflow. Do not describe a native mobile client as a shipped feature based on this document.

## If a mobile client is added

Treat it as a new client of the existing versioned REST API. Before selecting a framework, define supported OS versions, secure credential storage, deep-link and invitation-link handling, privacy disclosures, accessibility targets, offline-data behavior, and release/signing procedures.

Mobile clients should use the existing server-side authorization model; they must never treat local role checks as authorization. Store refresh credentials only in the platform secure storage mechanism, keep short-lived access credentials in memory where practical, and support revocation/logout. Never embed backend secrets or payment-provider secret keys in an application bundle.

This is planning guidance, not evidence of an implemented mobile design.