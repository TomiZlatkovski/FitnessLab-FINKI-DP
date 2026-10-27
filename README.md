# FitnessLab

FitnessLab is a bilingual English/Macedonian training website with a SQLite-backed trainer schedule and appointment booking.

## Run locally

Requirements: Node.js 24 or newer.

From the project folder, set a private admin password and start the server:

```sh
ADMIN_PASSWORD='replace-this-with-a-private-password' npm start
```

Open [http://localhost:3000](http://localhost:3000). The public trainer and booking page is `/trainers.html`; trainer administration is `/admin.html`.

The server binds to `127.0.0.1` by default. It creates `data/fitnesslab.sqlite` for trainers, availability, and bookings. Set `DATABASE_PATH` to use another writable database file, or `PORT` to use a different port.
An empty database is populated with five coaches, portrait images, and weekly availability. Update their details and schedules in the admin page as needed.

## Configure trainers and bookings

1. Sign in at `/admin.html` with the `ADMIN_PASSWORD` used to start the server.
2. Edit each trainer’s name, specialty, short biography, optional profile photo, and weekly availability. Photos can use an HTTPS URL or an uploaded JPEG, PNG, or WebP image (up to 1.5 MB).
3. Visitors can select an active trainer, choose an available one-hour session within the next 60 days, and submit their contact details.
4. Staff can review and cancel bookings from the admin page. Cancellation releases the time slot.

Bookings are stored in SQLite and are not automatically emailed. Visitors should call FitnessLab to change or cancel an appointment.

## Enquiry email

Contact forms use FormSubmit to forward enquiries to `support@fitnesslab.com`. The recipient must complete FormSubmit’s first-time email verification before delivery is enabled. Verify delivery before relying on the form, and do not ask visitors to submit sensitive health information.

## Public deployment

For public hosting, use HTTPS, persistent writable storage for the SQLite database, and the host’s supported process manager. Keep `ADMIN_PASSWORD` private. If the hosting platform requires a public bind address, configure `HOST` accordingly and protect the server behind the platform’s HTTPS and network controls; the default is intentionally local-only.
