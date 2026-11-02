# STC Résidence

Expo / React Native mobile app for university residence reports and service requests in Ouargla.

## Current screens

- Student or residence staff entry
- Google sign-in entry point and staff approval queue preview
- All 11 Ouargla university residences, grouped under DOU Ouargla and DOU Ouargla-Pôle; Khelafoui El-Hadj is the first available residence
- Service selection for catering, accommodation, health, transport, and activities
- Student report form, request list, service inbox, and residence rating
- Staff dashboard and manager announcement preview
- Profile space and STC project links

## Run

```sh
npm install
npm start
```

## Integration still required for a live service

This first build is a front-end prototype. Real Google sign-in, persistent reports and ratings, private chat, manager approvals, role permissions, announcement delivery, and account restrictions need an authenticated backend and Google OAuth client configuration. The current Google button and manager controls are clearly marked as previews and do not create real accounts or send messages. Keep manager access and all role changes server-authorized in production.

## Residence source

Residence names and DOU grouping follow the 2025 Algerian Official Journal list. Service categories reflect student-life services described by Université Kasdi Merbah Ouargla.

- https://www.joradp.dz/FTP/jo-francais/2025/F2025063.pdf
- https://www.univ-ouargla.dz/Guide_bachelier_juillet2021_compressed.pdf
