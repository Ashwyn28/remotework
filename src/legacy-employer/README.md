# Legacy employer flow (not in the build)

Posting a paid listing: Google sign-in for businesses, the listing form and Stripe checkout.
These pages talked to the old Django API, which has known security problems:

- `create/` and `success/` let anyone add a listing or mark one paid;
- `auth/` crashes on a bad token and does not check that Google verified the email;
- `user/?pk=` shows any user's name and email to any signed-in user;
- the business token is kept in localStorage and never expires.

They were moved out of `src/routes` when the site became static, so they are no longer
published. Rebuild the employer flow against the serverless API before bringing them back.
