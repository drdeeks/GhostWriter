# Admin Guide

This guide provides an overview of the administrative features available in Ghost Writer, including the admin dashboard and admin-only API routes.

## 👑 Admin Dashboard

The admin dashboard, available at `/admin`, provides access to a variety of administrative functions. Access to this page should be restricted in a production environment.

### Features
- **Signer Configuration**: Configure the EIP-712 signer for story template approvals.
- **Max Active Stories**: Set the maximum number of stories that can be active at one time.
- **Force Complete a Story**: Manually mark a story as complete, triggering the NFT reveal process.
- **Token Buckets**: Manage the distribution of the `GhostWriterToken`.
- **AI Story Preview**: Preview AI-generated stories with different parameters without changing environment variables.

## 🔐 Admin API Routes

The application includes several admin-only API routes that provide access to sensitive operations. These routes should be protected by an authentication layer in a production environment.

- **`/api/admin/generate-story`**: An admin-only version of the story generation route that allows for overriding the AI model and other parameters.
- **`/api/admin/metrics`**: An endpoint for retrieving application metrics, such as the number of active stories and total contributions.
- **`/api/admin/active-addresses`**: An endpoint to retrieve a list of active addresses.
