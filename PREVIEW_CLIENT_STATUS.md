# Protected preview client contract

The web client plays only URLs returned by the API. `preview_url` is the canonical public playback URL. During the compatibility window, `audio_url` may be used when `preview_url` is absent; when both are present, `preview_url` always wins. The client never infers storage or audio paths.

`processing_status` can be `processing`, `ready`, or `failed`. A beat is playable only when the status is `ready` and it has a valid preview URL. Missing preview, failed status, or an unknown status display “Preview no disponible”; processing displays “Preparando preview”.

Playback, likes that require listening, and play counters are disabled or suppressed without a preview. Private storage keys, master paths, and other internal fields are discarded by beat normalization and are never used by the UI. Masters are not exposed by this client.

Uploads include `preview_start` and `preview_end` when the user has selected values. If the upload response resolves to `processing`, the page reports that the preview is being prepared and does not claim publication success. The client currently does not poll: no polling endpoint is part of the available contract. A `ready` response with a valid preview is required before the upload flow reports success.

Reproducible checks: `npm ci`, `npm run lint`, `npm test`, and `npm run build`. The deployment workflow also runs `npm run scan:artifacts` to check built files for leaked development and private media details.
